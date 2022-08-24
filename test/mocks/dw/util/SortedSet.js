var ArrayList = require('../../dw.util.Collection');

class sortedSet {
  /**
   * @param {dw.util.PropertyComparator} comparator
   */
  constructor(comparator) {
    this.objects = new ArrayList();
    this.comparator = comparator;
  }

  /**
   * @param {dw.util.Collection} collection
   */
  addAll(collection) {
    const iterator = collection.iterator();
    while (iterator.hasNext()) {
      const item = iterator.next();
      this.objects.add(item);
    }
    this.objects.sort(this.comparator.compare);
  }
}

module.exports = sortedSet;
