function Money(isAvailable, value) {
  return {
    available: isAvailable,
    value: value || '10.99',
    getDecimalValue() {
      return value.toString() || '10.99';
    },
    getValue() {
      return value || 10.99;
    },
    getCurrencyCode() {
      return 'USD';
    },
    subtract() {
      return new Money(isAvailable);
    },
    add() {
      return new Money(isAvailable);
    },
  };
}

module.exports = Money;
