import React from 'react';
import './Common.css';

interface Column<T> {
  key: keyof T | string;
  title: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  fixed?: 'left' | 'right';
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    onChange: (page: number, pageSize: number) => void;
  };
  rowKey?: keyof T | ((record: T) => string);
  onRow?: (record: T) => {
    onClick?: () => void;
    onDoubleClick?: () => void;
    className?: string;
  };
  emptyText?: string;
  size?: 'small' | 'medium' | 'large';
  bordered?: boolean;
  hover?: boolean;
  striped?: boolean;
  className?: string;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  rowKey = 'id',
  onRow,
  emptyText = 'No data available',
  size = 'medium',
  bordered = true,
  hover = true,
  striped = false,
  className = ''
}: TableProps<T>) => {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  const getValue = (record: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], record);
    }
    return record[key as keyof T];
  };

  const tableClasses = `table table-${size} ${bordered ? 'table-bordered' : ''} ${hover ? 'table-hover' : ''} ${striped ? 'table-striped' : ''} ${className}`.trim();

  const renderPagination = () => {
    if (!pagination) return null;

    const { current, pageSize, total, onChange } = pagination;
    const totalPages = Math.ceil(total / pageSize);
    const startItem = (current - 1) * pageSize + 1;
    const endItem = Math.min(current * pageSize, total);

    return (
      <div className="table-pagination">
        <div className="pagination-info">
          Showing {startItem} to {endItem} of {total} entries
        </div>
        <div className="pagination-controls">
          <button
            className="pagination-btn"
            disabled={current === 1}
            onClick={() => onChange(current - 1, pageSize)}
          >
            Previous
          </button>
          <span className="pagination-current">
            Page {current} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            disabled={current === totalPages}
            onClick={() => onChange(current + 1, pageSize)}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <div className="table-wrapper">
        <table className={tableClasses}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th
                  key={`header-${index}`}
                  style={{
                    width: column.width,
                    textAlign: column.align || 'left'
                  }}
                  className={`table-header ${column.sortable ? 'sortable' : ''}`}
                >
                  {column.title}
                  {column.sortable && (
                    <span className="sort-indicator">↕️</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => {
                const rowProps = onRow ? onRow(record) : {};
                const key = getRowKey(record, index);
                
                return (
                  <tr
                    key={key}
                    className={rowProps.className || ''}
                    onClick={rowProps.onClick}
                    onDoubleClick={rowProps.onDoubleClick}
                  >
                    {columns.map((column, colIndex) => {
                      const value = getValue(record, column.key);
                      const cellContent = column.render
                        ? column.render(value, record, index)
                        : value;
                      
                      return (
                        <td
                          key={`cell-${index}-${colIndex}`}
                          style={{
                            textAlign: column.align || 'left'
                          }}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {renderPagination()}
    </div>
  );
};

export default Table;