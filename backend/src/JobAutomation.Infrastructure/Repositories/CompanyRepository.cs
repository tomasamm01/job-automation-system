using JobAutomation.Core.Entities;
using JobAutomation.Core.Interfaces.Repositories;
using JobAutomation.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobAutomation.Infrastructure.Repositories;

public class CompanyRepository : Repository<Company>, ICompanyRepository
{
    public CompanyRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Company?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(c => c.Name.ToLower() == name.ToLower(), cancellationToken);
    }

    public async Task<Company?> GetWithJobsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Jobs)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }
}
