import { ContentKanban } from '@/components/ContentKanban';
import { useParams } from 'wouter';

export default function ContentFactory() {
  const params = useParams();
  const projectId = params?.projectId || '';

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Project ID não fornecido</p>
      </div>
    );
  }

  return <ContentKanban projectId={projectId} />;
}
