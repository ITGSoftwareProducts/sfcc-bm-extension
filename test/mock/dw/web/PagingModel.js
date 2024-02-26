class PageElements {
    constructor(elements) {
        this.elements = elements || [];
    }

    asList() {
        return this.elements;
    }
}
class PagingModel {
    constructor() {
        this.currentPage = 1;
        this.pageSize = 10;
        this.totalItems = 100;
        this.count = 100;
        this.pageCount = 5;
        this.pageElements = new PageElements();
    }

    setPageSize(newPageSize) {
        this.pageSize = newPageSize;
    }
    setStart(newStart) {
        this.start = newStart;
    }
}

module.exports = PagingModel;
