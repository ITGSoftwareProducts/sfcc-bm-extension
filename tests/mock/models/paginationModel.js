class PaginationModel {
    constructor() {
        this.start = 0;
        this.totalCount = 0;
        this.pageSize = 0;
        this.pageCount = 0;
        this.currentPage = 0;
        this.itemNumber = 0;
        this.itemPerPage = 0;
        this.pageSizeUr = null;
        this.url = null;
    }
}
module.exports = PaginationModel;
