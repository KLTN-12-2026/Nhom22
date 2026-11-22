'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Icon, useToast } from '@/components/ui';

const KEY = ['privacy-settings'];

const OPTIONS = [
  { name: 'congKhaiHoatDong', title: 'Hiện hoạt động học trên hồ sơ công khai', desc: 'Người khác xem hồ sơ tác giả của bạn sẽ thấy bảng lượt ôn và đóng góp công khai trong năm. Phút học và kết quả luyện tập luôn được giữ riêng.' },
  { name: 'thamGiaXepHang', title: 'Tham gia bảng xếp hạng siêng năng', desc: 'Tên, ảnh đại diện, số ngày học và số lượt ôn trong tuần/tháng của bạn hiện trên bảng xếp hạng.' }
];

export default function PrivacyPage() {
  const client = useQueryClient();
  const { toast } = useToast();
  const settings = useQuery({ queryKey: KEY, queryFn: () => apiFetch('/api/v1/me/privacy-settings') });
  const save = useMutation({
    mutationFn: body => apiFetch('/api/v1/me/privacy-settings', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: data => {
      client.setQueryData(KEY, data);
      client.invalidateQueries({ queryKey: ['leaderboard'] });
      toast('Đã lưu quyền riêng tư', { variant: 'success' });
    },
    onError: error => {
      toast(error.message, { variant: 'error' });
      if (error.status === 409) settings.refetch();
    }
  });

  if (settings.isLoading) return <div className="skeleton"><div className="sk sk-row" /></div>;
  if (settings.error) return <ErrorState description={settings.error.message} onRetry={settings.refetch} />;
  const data = settings.data;

  const toggle = name => save.mutate({
    congKhaiHoatDong: data.congKhaiHoatDong,
    thamGiaXepHang: data.thamGiaXepHang,
    [name]: !data[name],
    version: data.version
  });

  return <>
    <div className="form-head">
      <div className="form-code"><span>Tài khoản</span><span>Quyền riêng tư</span></div>
      <h1 id="page-title">Quyền riêng tư</h1>
      <p>Chọn những gì người khác được thấy. Thay đổi được lưu ngay.</p>
    </div>
    <div className="settings-form">
      <fieldset className="fieldset" disabled={save.isPending}>
        <legend>Hiển thị công khai</legend>
        {OPTIONS.map(option => <label key={option.name} className="choice choice-card">
          <input type="checkbox" name={option.name} checked={!!data[option.name]} onChange={() => toggle(option.name)} />
          <span className="bubble box" aria-hidden="true"><Icon name="check" size={16} /></span>
          <span className="choice-body">
            <span className="choice-title">{option.title}</span>
            <span className="choice-desc">{option.desc}</span>
          </span>
        </label>)}
      </fieldset>
    </div>
  </>;
}
