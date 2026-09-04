import { Icon } from '@/components/Icon';

const loaderPath =
  'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83';

export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex justify-center py-6">
      <Icon d={loaderPath} className="animate-spin text-slate-500" size={size} />
    </div>
  );
}
