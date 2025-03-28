{transaction.type === "EXPENSE" ? "-" : "+"}₹{transaction.amount.toFixed(2)}
₹{monthlyTotals.totalIncome.toFixed(2)}
₹{monthlyTotals.totalExpenses.toFixed(2)}
₹{(monthlyTotals.totalIncome - monthlyTotals.totalExpenses).toFixed(2)}
label={({ name, value }) => `${name}: ₹${value.toFixed(2)}`}
formatter={(value) => `₹${value.toFixed(2)}`} 