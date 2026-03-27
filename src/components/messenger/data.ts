export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  type: 'personal' | 'group' | 'channel' | 'secret';
  pinned?: boolean;
}

export interface Message {
  id: string;
  text: string;
  time: string;
  from: 'me' | 'other';
  status?: 'sent' | 'delivered' | 'read';
  encrypted?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  username: string;
  online: boolean;
  lastSeen?: string;
  phone?: string;
}

export interface CallRecord {
  id: string;
  name: string;
  avatar: string;
  type: 'incoming' | 'outgoing' | 'missed';
  callType: 'audio' | 'video';
  time: string;
  duration?: string;
}

export const CHATS: Chat[] = [
  { id: '1', name: 'Алексей Громов', avatar: 'АГ', lastMessage: 'Хорошо, завтра обсудим', time: '14:32', unread: 3, online: true, type: 'personal', pinned: true },
  { id: '2', name: 'Команда Проекта', avatar: '👥', lastMessage: 'Дедлайн перенесли на пятницу', time: '13:10', unread: 0, online: false, type: 'group' },
  { id: '3', name: 'Секретный чат', avatar: '🔒', lastMessage: 'Ключи переданы', time: '12:00', unread: 1, online: true, type: 'secret' },
  { id: '4', name: 'Tech News', avatar: '📡', lastMessage: 'Новый релиз React 20 уже доступен', time: '11:45', unread: 12, online: false, type: 'channel' },
  { id: '5', name: 'Мария Ковалёва', avatar: 'МК', lastMessage: 'Отправила файлы', time: '10:20', unread: 0, online: true, type: 'personal' },
  { id: '6', name: 'Дизайн-команда', avatar: '🎨', lastMessage: 'Правки согласованы', time: 'вчера', unread: 0, online: false, type: 'group' },
  { id: '7', name: 'Крипто-канал', avatar: '₿', lastMessage: 'BTC пробил 100к', time: 'вчера', unread: 5, online: false, type: 'channel' },
  { id: '8', name: 'Дмитрий Фёдоров', avatar: 'ДФ', lastMessage: 'Встреча в 15:00', time: 'вчера', unread: 0, online: false, type: 'personal' },
];

export const MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: 'm1', text: 'Привет! Как дела?', time: '14:10', from: 'other', encrypted: true },
    { id: 'm2', text: 'Всё отлично, работаем над проектом', time: '14:12', from: 'me', status: 'read', encrypted: true },
    { id: 'm3', text: 'Когда сможешь показать результаты?', time: '14:15', from: 'other', encrypted: true },
    { id: 'm4', text: 'Думаю к концу недели будет готово', time: '14:20', from: 'me', status: 'read', encrypted: true },
    { id: 'm5', text: 'Хорошо, завтра обсудим', time: '14:32', from: 'other', encrypted: true },
  ],
  '3': [
    { id: 's1', text: '🔒 Этот чат защищён сквозным шифрованием', time: '12:00', from: 'other', encrypted: true },
    { id: 's2', text: 'Ключи переданы', time: '12:00', from: 'other', encrypted: true },
  ],
};

export const CONTACTS: Contact[] = [
  { id: 'c1', name: 'Алексей Громов', avatar: 'АГ', username: '@alexgromov', online: true, phone: '+7 900 123-45-67' },
  { id: 'c2', name: 'Мария Ковалёва', avatar: 'МК', username: '@masha_k', online: true, lastSeen: 'онлайн', phone: '+7 911 234-56-78' },
  { id: 'c3', name: 'Дмитрий Фёдоров', avatar: 'ДФ', username: '@dfedorov', online: false, lastSeen: '1 час назад', phone: '+7 922 345-67-89' },
  { id: 'c4', name: 'Наталья Соколова', avatar: 'НС', username: '@nat_sok', online: false, lastSeen: 'вчера', phone: '+7 933 456-78-90' },
  { id: 'c5', name: 'Игорь Белов', avatar: 'ИБ', username: '@ibelov', online: true, lastSeen: 'онлайн', phone: '+7 944 567-89-01' },
];

export const CALLS: CallRecord[] = [
  { id: 'r1', name: 'Алексей Громов', avatar: 'АГ', type: 'incoming', callType: 'video', time: 'сегодня 13:40', duration: '12 мин' },
  { id: 'r2', name: 'Мария Ковалёва', avatar: 'МК', type: 'missed', callType: 'audio', time: 'сегодня 11:15' },
  { id: 'r3', name: 'Дмитрий Фёдоров', avatar: 'ДФ', type: 'outgoing', callType: 'audio', time: 'вчера 18:30', duration: '5 мин' },
  { id: 'r4', name: 'Наталья Соколова', avatar: 'НС', type: 'incoming', callType: 'video', time: 'вчера 15:00', duration: '34 мин' },
  { id: 'r5', name: 'Игорь Белов', avatar: 'ИБ', type: 'outgoing', callType: 'video', time: '2 дня назад', duration: '8 мин' },
];

export const ADMIN_CODE = '142857';
