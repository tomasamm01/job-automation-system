import { useState } from 'react';
import { useCreateApplication } from '@/hooks';
import type { CreateApplicationDto } from '@/types';

interface ApplyToJobButtonProps {
  jobId: string;
  jobTitle: string;
  onSuccess?: () => void;
}

export function ApplyToJobButton({ jobId, jobTitle, onSuccess }: ApplyToJobButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const createApplication = useCreateApplication();

  const handleApply = async (dto: CreateApplicationDto) => {
    try {
      await createApplication.mutateAsync(dto);
      setShowModal(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to apply:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Apply Now
      </button>

      {showModal && (
        <ApplicationModal
          jobId={jobId}
          jobTitle={jobTitle}
          onSubmit={handleApply}
          onClose={() => setShowModal(false)}
          isSubmitting={createApplication.isPending}
          error={createApplication.error}
        />
      )}
    </>
  );
}

function ApplicationModal({
  jobId,
  jobTitle,
  onSubmit,
  onClose,
  isSubmitting,
  error,
}: {
  jobId: string;
  jobTitle: string;
  onSubmit: (dto: CreateApplicationDto) => void;
  onClose: () => void;
  isSubmitting: boolean;
  error: Error | null;
}) {
  const [coverLetter, setCoverLetter] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      jobId,
      coverLetter: coverLetter || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Apply to {jobTitle}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Cover Letter (Optional)
            </label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Tell the employer why you're a great fit..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Personal notes about this application..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error.message}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
