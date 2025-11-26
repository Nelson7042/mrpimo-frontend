"use client"

import { useState } from "react"
import { Send, Paperclip, Smile } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BreadcrumbItem, Breadcrumbs } from "@/components/BraedCrumbs"
import { useRouter } from "next/navigation"

const contacts = [
  {
    id: "1",
    name: "John David",
    initials: "JD",
    lastMessage: "Hello! You can ask me any question about my product",
    time: "9:30am",
    isOnline: true,
    unread: 0,
  },
  {
    id: "2",
    name: "Daniel Uche",
    initials: "DU",
    lastMessage: "Hello! You can ask me any question about my product",
    time: "9:30am",
    isOnline: false,
    unread: 0,
  },
  {
    id: "3",
    name: "Mary Jacob",
    initials: "MJ",
    lastMessage: "Hello! You can ask me any question about my product",
    time: "9:30am",
    isOnline: false,
    unread: 0,
  },
  {
    id: "4",
    name: "Antony Sancho",
    initials: "AS",
    lastMessage: "Hello! You can ask me any question about my product",
    time: "9:30am",
    isOnline: false,
    unread: 0,
  },
  {
    id: "5",
    name: "Obinna Ayo",
    initials: "OA",
    lastMessage: "Hello! You can ask me any question about my product",
    time: "9:30am",
    isOnline: false,
    unread: 0,
  },
  {
    id: "6",
    name: "Musa Hamza",
    initials: "MH",
    lastMessage: "Hello! You can ask me any question about my product",
    time: "9:30am",
    isOnline: false,
    unread: 0,
  },
  {
    id: "7",
    name: "Dan OT",
    initials: "DO",
    lastMessage: "Hello! You can ask me any question about my product",
    time: "9:30am",
    isOnline: false,
    unread: 0,
  },
]

const messages = [
  {
    id: "1",
    senderId: "1",
    content:
      "Hello, Valued Buyer! You've arrived at the perfect spot to connect with us. Whether you have questions about your orders, need help with a product, simply drop your message here, and we will respond within 10 minutes.",
    time: "Tue 11:34 PM",
    isOwn: false,
  },
]

export default function MessagesPage() {
  const [selectedContact, setSelectedContact] = useState(contacts[0])
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      console.log("Sending message:", newMessage)
      setNewMessage("")
    }
  }
    const router = useRouter()

  

  const manualBreadcrumbs: BreadcrumbItem[] = [
    { label: "Cart", href: "/my-cart" },
    { label: "Auction", href: null},
  
  ];
  const handleBreadcrumbClick = (
    item: BreadcrumbItem,
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    console.log("Breadcrumb clicked:", item);
    if (item.href) {
     router.push(item?.href);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
    
       <div className="pb-4">
                  <h2 className="text-xl font-bold">My Messages</h2>
                </div>

          <div className="bg-white rounded-lg border overflow-hidden h-[calc(100vh-200px)]">
            <div className="flex h-full">
              {/* Contacts List */}
              <div className="w-1/3 border-r">
               
                <div className="overflow-y-auto h-full">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-4 border-b cursor-pointer rounded-md hover:bg-gray-50 ${
                        selectedContact.id === contact.id ? "bg-blue-50 border-r-2 border-r-blue-600" : ""
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="bg-blue-600 text-white">
                            <AvatarFallback className="bg-blue-600 text-white">{contact.initials}</AvatarFallback>
                          </Avatar>
                          {contact.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-sm">{contact.name}</h3>
                            <span className="text-xs text-gray-500">{contact.time}</span>
                          </div>
                          {contact.isOnline && <div className="text-xs text-green-600 mb-1">Online</div>}
                          <p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center space-x-3">
                  <Avatar className="bg-blue-600 text-white">
                    <AvatarFallback className="bg-blue-600 text-white">{selectedContact.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedContact.name}</h3>
                    {selectedContact.isOnline && <span className="text-sm text-green-600">Online</span>}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isOwn ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.isOwn ? "text-blue-100" : "text-gray-500"}`}>
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type message to here..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="pr-12"
                      />
                      <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
     
    </div>
  )
}
