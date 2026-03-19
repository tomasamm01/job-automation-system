using JobAutomation.Core.Interfaces.Repositories;

namespace JobAutomation.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IJobRepository Jobs { get; }
    IApplicationRepository Applications { get; }
    ICompanyRepository Companies { get; }
    IMetricRepository Metrics { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
