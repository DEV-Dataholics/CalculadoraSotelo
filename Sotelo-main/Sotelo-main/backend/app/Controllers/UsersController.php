<?php

namespace App\Controllers;

use App\Models\UserModel;
use CodeIgniter\HTTP\ResponseInterface;

class UsersController extends BaseController
{
    private function db()
    {
        return \Config\Database::connect();
    }

    public function index(): ResponseInterface
    {
        $users = (new UserModel())->orderBy('id', 'ASC')->findAll();

        foreach ($users as &$user) {
            $roles = $this->db()->table('roles r')
                ->select('r.id, r.name')
                ->join('user_roles ur', 'ur.role_id = r.id')
                ->where('ur.user_id', $user['id'])
                ->get()->getResultArray();
            $user['roles']    = array_column($roles, 'name');
            $user['role_ids'] = array_map('intval', array_column($roles, 'id'));
            unset($user['password_hash']);
        }

        return $this->response->setJSON(['data' => $users]);
    }

    public function listRoles(): ResponseInterface
    {
        $roles = $this->db()->table('roles')->orderBy('id')->get()->getResultArray();
        return $this->response->setJSON(['data' => $roles]);
    }

    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        if (empty($data['email']) || empty($data['password'])) {
            return $this->response->setStatusCode(422)
                ->setJSON(['message' => 'Email y contraseña son requeridos']);
        }

        $userModel = new UserModel();
        if ($userModel->findByEmail($data['email'])) {
            return $this->response->setStatusCode(409)
                ->setJSON(['message' => 'Ya existe un usuario con ese email']);
        }

        $userId = $userModel->insert([
            'email'         => trim($data['email']),
            'password_hash' => password_hash($data['password'], PASSWORD_ARGON2ID),
            'is_active'     => 1,
        ]);

        if (!empty($data['role_ids'])) {
            foreach ((array) $data['role_ids'] as $roleId) {
                $this->db()->table('user_roles')->insert([
                    'user_id' => $userId,
                    'role_id' => (int) $roleId,
                ]);
            }
        }

        return $this->response->setStatusCode(201)->setJSON(['id' => $userId, 'message' => 'Usuario creado']);
    }

    public function update(int $id): ResponseInterface
    {
        $userModel = new UserModel();
        if (!$userModel->find($id)) {
            return $this->response->setStatusCode(404)->setJSON(['message' => 'Usuario no encontrado']);
        }

        $data    = $this->request->getJSON(true);
        $updates = [];

        if (isset($data['email']))     $updates['email']     = trim($data['email']);
        if (isset($data['is_active'])) $updates['is_active'] = (int) $data['is_active'];
        if (!empty($data['password'])) $updates['password_hash'] = password_hash($data['password'], PASSWORD_ARGON2ID);

        if (!empty($updates)) {
            $userModel->update($id, $updates);
        }

        if (isset($data['role_ids'])) {
            $this->db()->table('user_roles')->where('user_id', $id)->delete();
            foreach ((array) $data['role_ids'] as $roleId) {
                $this->db()->table('user_roles')->insert([
                    'user_id' => $id,
                    'role_id' => (int) $roleId,
                ]);
            }
        }

        return $this->response->setJSON(['message' => 'Usuario actualizado']);
    }

    public function delete(int $id): ResponseInterface
    {
        $userModel = new UserModel();
        if (!$userModel->find($id)) {
            return $this->response->setStatusCode(404)->setJSON(['message' => 'Usuario no encontrado']);
        }

        $currentUserId = $this->request->user['id'] ?? null;
        if ((int) $currentUserId === $id) {
            return $this->response->setStatusCode(403)
                ->setJSON(['message' => 'No puedes eliminar tu propia cuenta']);
        }

        $this->db()->table('user_roles')->where('user_id', $id)->delete();
        $this->db()->table('refresh_tokens')->where('user_id', $id)->delete();
        $userModel->delete($id);

        return $this->response->setStatusCode(204)->setBody('');
    }
}
