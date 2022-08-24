module.exports = function (property, sortOrder) {
  const splittedProperty = property.split('.');

  this.compare = function (item1, item2) {
    let v1 = item1;
    let v2 = item2;
    for (let i = 0; i < splittedProperty.length; i++) {
      v1 = v1[splittedProperty[i]];
      v2 = v2[splittedProperty[i]];
    }
    return sortOrder ? v1 > v2 : v2 <= v1;
  };
};
