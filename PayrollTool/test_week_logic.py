from datetime import datetime, date

def get_payroll_week(date_obj):
    """
    Returns the Custom Payroll Week number.
    Logic: ISO Week + 1 (Monday-Sunday cycle).
    Example: Sep 29, 2025 (ISO Wk 40) -> Payroll Wk 41
    """
    try:
        # isocalendar returns (year, week, day)
        iso_year, iso_week, iso_day = date_obj.isocalendar()
        return iso_week + 1
    except:
        return 0

# Test Cases
test_dates = [
    (date(2025, 9, 29), 41),  # Mon Sep 29 -> Wk 41
    (date(2025, 10, 5), 41),  # Sun Oct 05 -> Wk 41
    (date(2025, 10, 6), 42),  # Mon Oct 06 -> Wk 42
    (date(2025, 10, 20), 44), # Mon Oct 20 -> Wk 44
]

print("Running Week Logic Verification...")
all_passed = True
for d, expected in test_dates:
    actual = get_payroll_week(d)
    status = "✅ PASS" if actual == expected else f"❌ FAIL (Got {actual})"
    print(f"Date: {d} | Expected: {expected} | {status}")
    if actual != expected:
        all_passed = False

if all_passed:
    print("\nSUCCESS: All week logic tests passed.")
else:
    print("\nFAILURE: Some tests failed.")
