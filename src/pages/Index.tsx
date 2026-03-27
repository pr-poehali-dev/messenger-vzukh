import { useState } from 'react';
import Sidebar from '@/components/messenger/Sidebar';
import ChatList from '@/components/messenger/ChatList';
import ChatWindow from '@/components/messenger/ChatWindow';
import CallsView from '@/components/messenger/CallsView';
import ContactsView from '@/components/messenger/ContactsView';
import SettingsView from '@/components/messenger/SettingsView';
import ProfileView from '@/components/messenger/ProfileView';
import AdminPanel from '@/components/messenger/AdminPanel';
import { Chat } from '@/components/messenger/data';

type Section = 'chats' | 'calls' | 'channels' | 'groups' | 'contacts' | 'settings' | 'profile' | 'admin';

export default function Index() {
  const [section, setSection] = useState<Section>('chats');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const renderContent = () => {
    switch (section) {
      case 'chats':
        return (
          <>
            <ChatList
              title="Чаты"
              filterType={['personal', 'secret']}
              selectedId={selectedChat?.id}
              onSelect={setSelectedChat}
              onNewChat={() => {}}
            />
            <ChatWindow chat={selectedChat} />
          </>
        );
      case 'calls':
        return <CallsView />;
      case 'channels':
        return (
          <>
            <ChatList
              title="Каналы"
              filterType="channel"
              selectedId={selectedChat?.id}
              onSelect={setSelectedChat}
              onNewChat={() => {}}
            />
            <ChatWindow chat={selectedChat} />
          </>
        );
      case 'groups':
        return (
          <>
            <ChatList
              title="Группы"
              filterType="group"
              selectedId={selectedChat?.id}
              onSelect={setSelectedChat}
              onNewChat={() => {}}
            />
            <ChatWindow chat={selectedChat} />
          </>
        );
      case 'contacts':
        return <ContactsView />;
      case 'settings':
        return <SettingsView />;
      case 'profile':
        return <ProfileView />;
      case 'admin':
        return <AdminPanel />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar
        active={section}
        onChange={(s) => {
          setSection(s);
          if (s !== 'chats' && s !== 'channels' && s !== 'groups') {
            setSelectedChat(null);
          }
        }}
      />
      <main className="flex flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}
