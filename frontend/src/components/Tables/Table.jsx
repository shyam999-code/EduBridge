import React from 'react';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  pagination = null, // { currentPage, totalPages, totalRecords, pageSize, onPageChange }
  className = ''
}) => {
  return (
    <div className={`table-responsive ${className}`}>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{
                  width: col.width || 'auto',
                  textAlign: col.align || 'left'
                }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="text-muted" style={{ fontWeight: 500 }}>Retrieving records...</span>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="text-muted" style={{ fontWeight: 500 }}>{emptyMessage}</span>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx}>
                {columns.map((col, colIdx) => {
                  const cellValue = row[col.key];
                  return (
                    <td
                      key={col.key || colIdx}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render ? col.render(cellValue, row, rowIdx) : cellValue}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Footer */}
      {!loading && data.length > 0 && pagination && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing <strong>{Math.min(data.length, pagination.pageSize)}</strong> of{' '}
            <strong>{pagination.totalRecords || data.length}</strong> records
          </div>
          <div className="pagination-buttons">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => pagination.onPageChange(i + 1)}
                className={`pagination-btn ${pagination.currentPage === i + 1 ? 'active' : ''}`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Table;
