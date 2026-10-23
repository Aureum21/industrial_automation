import LabWorkspace from '@/components/lab/LabWorkspace';
export const metadata = { title: 'Logic lab', description: 'Build, simulate, and test industrial logic in your browser.' };
export default function LabPage() {
  return (
    <div className="h-[calc(100dvh-58px)] w-full overflow-hidden">
      <LabWorkspace />
    </div>
  );
}
