import { useCallback, useEffect, useState } from 'react';
import { Alert, Avatar, Button, Select, Skeleton, Switch, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons';
import { apiClient } from '../../services/api';
import '../ControlCenter/ControlCenter.css';

type AdminRow={id:number;username:string;email:string;accessRole:string;active:boolean;scopes:string[]};
const roles=[{value:'SUPER_ADMIN',label:'Super Admin'},{value:'FINANCE_ADMIN',label:'Tài chính'},{value:'SUPPORT_ADMIN',label:'Hỗ trợ'},{value:'CONTENT_ADMIN',label:'Nội dung'},{value:'ANALYST',label:'Phân tích'}];
export function AdminAccessPage(){const[rows,setRows]=useState<AdminRow[]>([]);const[loading,setLoading]=useState(true);const load=useCallback(async()=>{setLoading(true);try{const r=await apiClient.get('/api/v1/admin/access');setRows(r.data?.data||[])}catch{message.error('Không tải được phân quyền')}finally{setLoading(false)}},[]);
// Initial access synchronization.
// eslint-disable-next-line react-hooks/set-state-in-effect
useEffect(()=>{void load()},[load]); const update=async(row:AdminRow,patch:Partial<AdminRow>)=>{try{await apiClient.put(`/api/v1/admin/access/${row.id}`,{accessRole:patch.accessRole||row.accessRole,active:patch.active??row.active});message.success('Đã cập nhật quyền');await load()}catch{message.error('Không thể cập nhật quyền quản trị')}};
const columns:ColumnsType<AdminRow>=[{title:'Quản trị viên',render:(_,r)=><div style={{display:'flex',alignItems:'center',gap:10}}><Avatar icon={<UserOutlined/>}/><div className="control-person"><strong>{r.username}</strong><span>{r.email}</span></div></div>},{title:'Vai trò vận hành',dataIndex:'accessRole',render:(v,record)=><Select style={{width:170}} value={v} options={roles} onChange={accessRole=>void update(record,{accessRole})}/>},{title:'Phạm vi',dataIndex:'scopes',render:(v:string[])=><>{v.map(s=><Tag key={s}>{s}</Tag>)}</>},{title:'Hoạt động',dataIndex:'active',render:(v,record)=><Switch checked={v} onChange={active=>void update(record,{active})}/>}];
return <main className="control-page"><header className="control-hero"><div className="control-icon"><SafetyCertificateOutlined/></div><div><span>An toàn hệ thống</span><h2>Phân quyền quản trị</h2><p>Tách trách nhiệm tài chính, hỗ trợ, nội dung và phân tích theo nguyên tắc tối thiểu.</p></div><Button onClick={()=>void load()}>Làm mới</Button></header><Alert showIcon type="warning" message="Super Admin là vai trò duy nhất được thay đổi quyền. Bạn không thể tự hạ quyền hoặc vô hiệu hóa chính mình."/><section className="control-table">{loading?<Skeleton active paragraph={{rows:8}}/>:<Table rowKey="id" columns={columns} dataSource={rows} pagination={false}/>}</section></main>}
