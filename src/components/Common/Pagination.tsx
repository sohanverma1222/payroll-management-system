import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showItemsPerPage?: boolean;
  showTotalItems?: boolean;
  showPageInfo?: boolean;
  maxVisiblePages?: number;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined' | 'minimal';
  className?: string;
  disabled?: boolean;
  itemsPerPageOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  showTotalItems = true,
  showPageInfo = true,
  maxVisiblePages = 5,
  size = 'medium',
  variant = 'default',
  className = '',
  disabled = false,
  itemsPerPageOptions = [10, 20, 50, 100]
}) => {
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && !disabled) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    if (onItemsPerPageChange && !disabled) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    }
    if (currentPage + halfVisible >= totalPages) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('...');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'pagination-small';
      case 'medium': return 'pagination-medium';
      case 'large': return 'pagination-large';
      default: return 'pagination-medium';
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case 'default': return 'pagination-default';
      case 'outlined': return 'pagination-outlined';
      case 'minimal': return 'pagination-minimal';
      default: return 'pagination-default';
    }
  };

  const paginationClasses = [
    'pagination',
    getSizeClass(),
    getVariantClass(),
    disabled ? 'pagination-disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={paginationClasses}>
      {/* Items per page selector */}
      {showItemsPerPage && onItemsPerPageChange && (
        <div className="pagination-per-page">
          <label htmlFor="items-per-page">Items per page:</label>
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            disabled={disabled}
            className="pagination-select"
          >
            {itemsPerPageOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Page info */}
      {showPageInfo && (
        <div className="pagination-info">
          Showing {startItem} to {endItem} of {totalItems} items
        </div>
      )}

      {/* Navigation controls */}
      <div className="pagination-nav">
        {/* First page button */}
        <button
          className="pagination-button pagination-first"
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || disabled}
          aria-label="First page"
        >
          ⟪
        </button>

        {/* Previous page button */}
        <button
          className="pagination-button pagination-prev"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          aria-label="Previous page"
        >
          ⟨
        </button>

        {/* Page numbers */}
        <div className="pagination-pages">
          {getVisiblePages().map((page, index) => (
            <button
              key={index}
              className={`pagination-button pagination-page ${
                page === currentPage ? 'pagination-current' : ''
              } ${page === '...' ? 'pagination-ellipsis' : ''}`}
              onClick={() => typeof page === 'number' && handlePageChange(page)}
              disabled={page === '...' || disabled}
              aria-label={`Page ${page}`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next page button */}
        <button
          className="pagination-button pagination-next"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Next page"
        >
          ⟩
        </button>

        {/* Last page button */}
        <button
          className="pagination-button pagination-last"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Last page"
        >
          ⟫
        </button>
      </div>

      {/* Total items display */}
      {showTotalItems && (
        <div className="pagination-total">
          Total: {totalItems} items
        </div>
      )}
    </div>
  );
};

export default Pagination;