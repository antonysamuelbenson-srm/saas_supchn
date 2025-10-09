// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import axios from 'axios';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FiMessageSquare, FiX, FiSend, FiLoader } from 'react-icons/fi';

// const BASE_URL = "http://localhost:5500"; // Ensure this matches your backend URL

// const Chatbot = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { sender: 'bot', text: 'Hello! How can I help you with the inventory data today?' }
//   ]);
//   const [inputValue, setInputValue] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef(null);

//   // Automatically scroll to the latest message
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const handleSendMessage = useCallback(async () => {
//     const trimmedInput = inputValue.trim();
//     if (!trimmedInput) return;

//     const userMessage = { sender: 'user', text: trimmedInput };
//     setMessages(prev => [...prev, userMessage]);
//     setInputValue('');
//     setIsLoading(true);

//     try {
//       const token = localStorage.getItem("token");
//       const headers = { Authorization: `Bearer ${token}` };
      
//       const response = await axios.post(`${BASE_URL}/chat`, { query: trimmedInput }, { headers });
      
//       const botMessage = { sender: 'bot', text: response.data.response || "I'm not sure how to respond to that." };
//       setMessages(prev => [...prev, botMessage]);

//     } catch (error) {
//       console.error("Chatbot API error:", error);
//       const errorMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [inputValue]);

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   return (
//     <>
//       {/* Floating Action Button */}
//       <AnimatePresence>
//         {!isOpen && (
//           <motion.button
//             initial={{ opacity: 0, scale: 0.8, y: 50 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.8, y: 50 }}
//             transition={{ type: "spring", stiffness: 260, damping: 20 }}
//             onClick={() => setIsOpen(true)}
//             className="fixed bottom-6 right-6 z-[1001] p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
//             aria-label="Open AI Assistant"
//           >
//             <FiMessageSquare size={24} />
//           </motion.button>
//         )}
//       </AnimatePresence>

//       {/* Chat Window */}
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: 50 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 50 }}
//             transition={{ duration: 0.3, ease: "easeInOut" }}
//             className="fixed bottom-6 right-6 z-[1001] w-full max-w-sm h-[60vh] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
//           >
//             {/* Header */}
//             <header className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-700 flex-shrink-0">
//               <h3 className="text-lg font-bold text-white">AI Assistant</h3>
//               <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
//                 <FiX size={20} />
//               </button>
//             </header>

//             {/* Messages Area */}
//             <div className="flex-1 p-4 overflow-y-auto space-y-4">
//               {messages.map((msg, index) => (
//                 <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
//                   <div className={`max-w-xs md:max-w-md p-3 rounded-lg text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
//                     <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
//                   </div>
//                 </div>
//               ))}
//               {isLoading && (
//                  <div className="flex items-end gap-2 justify-start">
//                     <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-slate-700 text-slate-200 flex items-center">
//                         <FiLoader className="animate-spin mr-2"/>
//                         <span>Thinking...</span>
//                     </div>
//                 </div>
//               )}
//               <div ref={messagesEndRef} />
//             </div>

//             {/* Input Area */}
//             <div className="p-4 border-t border-slate-700 bg-slate-800 flex-shrink-0">
//               <div className="relative">
//                 <input
//                   type="text"
//                   value={inputValue}
//                   onChange={(e) => setInputValue(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   placeholder="Ask a question..."
//                   className="w-full bg-slate-900 border border-slate-600 rounded-md py-2 pl-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
//                   disabled={isLoading}
//                 />
//                 <button
//                   onClick={handleSendMessage}
//                   disabled={isLoading || !inputValue.trim()}
//                   className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   <FiSend size={16} />
//                 </button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default Chatbot;




// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import axios from 'axios';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FiMessageSquare, FiX, FiSend, FiCpu } from 'react-icons/fi';

// const BASE_URL = "http://localhost:5500"; // Ensure this matches your backend URL

// // Animation variants for the pulsating "thinking" dots
// const dotVariants = {
//   initial: {
//     y: "0%",
//   },
//   animate: {
//     y: "100%",
//   },
// };

// const Chatbot = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { sender: 'bot', text: 'Hello! How can I help you with the inventory data today?' }
//   ]);
//   const [inputValue, setInputValue] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef(null);

//   // Automatically scroll to the latest message
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages, isLoading]);

//   const handleSendMessage = useCallback(async () => {
//     const trimmedInput = inputValue.trim();
//     if (!trimmedInput) return;

//     const userMessage = { sender: 'user', text: trimmedInput };
//     setMessages(prev => [...prev, userMessage]);
//     setInputValue('');
//     setIsLoading(true);

//     try {
//       const token = localStorage.getItem("token");
//       const headers = { Authorization: `Bearer ${token}` };
      
//       const response = await axios.post(`${BASE_URL}/chat`, { query: trimmedInput }, { headers });
      
//       const botMessage = { sender: 'bot', text: response.data.response || "I'm not sure how to respond to that." };
//       setMessages(prev => [...prev, botMessage]);

//     } catch (error) {
//       console.error("Chatbot API error:", error);
//       const errorMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [inputValue]);

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   return (
//     <>
//       {/* Floating Action Button */}
//       <AnimatePresence>
//         {!isOpen && (
//           <motion.button
//             initial={{ opacity: 0, scale: 0.8, y: 50 }}
//             animate={{ 
//                 opacity: 1, 
//                 scale: 1, 
//                 y: 0,
//                 transition: { type: "spring", stiffness: 260, damping: 20 }
//             }}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             exit={{ opacity: 0, scale: 0.8, y: 50 }}
//             onClick={() => setIsOpen(true)}
//             className="fixed bottom-6 right-6 z-[1001] p-4 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-full shadow-2xl shadow-black/30 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
//             aria-label="Open AI Assistant"
//           >
//             <motion.div
//               animate={{
//                 scale: [1, 1.1, 1],
//                 transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
//               }}
//             >
//               <FiMessageSquare size={24} />
//             </motion.div>
//           </motion.button>
//         )}
//       </AnimatePresence>

//       {/* Chat Window */}
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: 50, scale: 0.9 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 50, scale: 0.9 }}
//             transition={{ duration: 0.3, ease: "easeInOut" }}
//             className="fixed bottom-6 right-6 z-[1001] w-full max-w-sm h-[70vh] bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
//           >
//             {/* Header */}
//             <header className="flex items-center justify-between p-4 bg-slate-900/70 border-b border-slate-700 flex-shrink-0 backdrop-blur-sm">
//               <div className='flex items-center gap-3'>
//                 <FiCpu className="text-violet-400" size={22} />
//                 <h3 className="text-lg font-bold text-white">AI Assistant</h3>
//               </div>
//               <motion.button 
//                 whileHover={{ scale: 1.1, rotate: 90 }}
//                 whileTap={{ scale: 0.9 }}
//                 onClick={() => setIsOpen(false)} 
//                 className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700"
//               >
//                 <FiX size={20} />
//               </motion.button>
//             </header>

//             {/* Messages Area */}
//             <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
//               {messages.map((msg, index) => (
//                 <motion.div 
//                   key={index} 
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
//                   className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//                 >
//                   {msg.sender === 'bot' && (
//                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>
//                   )}
//                   <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
//                     <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
//                   </div>
//                 </motion.div>
//               ))}
//               {isLoading && (
//                    <motion.div 
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.3, ease: 'easeOut' }}
//                     className="flex items-end gap-2 justify-start"
//                    >
//                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>
//                      <div className="max-w-xs md:max-w-md p-3 rounded-xl rounded-bl-none bg-slate-700 text-slate-200 flex items-center justify-center space-x-1.5">
//                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                      </div>
//                    </motion.div>
//               )}
//               <div ref={messagesEndRef} />
//             </div>

//            {/* Input Area */}
//             <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex-shrink-0">
//               <div className="relative">
//                 <input
//                   type="text"
//                   value={inputValue}
//                   onChange={(e) => setInputValue(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   placeholder="Ask a question..."
//                   className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-4 pr-14 text-white placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-violet-500"
//                   disabled={isLoading}
//                 />
//                 <motion.button
//                   whileHover={{ scale: 1.1 }}
//                   whileTap={{ scale: 0.9 }}
//                   onClick={handleSendMessage}
//                   disabled={isLoading || !inputValue.trim()}
//                   aria-label="Send message"
//                   // The classes here are the main fix
//                   className="absolute right-2 top-0 bottom-0 my-auto flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-blue-600 text-white transition-all hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   <FiSend size={16} />
//                 </motion.button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default Chatbot;





























// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import axios from 'axios';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FiMessageSquare, FiX, FiSend, FiCpu } from 'react-icons/fi';

// const BASE_URL = "http://localhost:5500"; // Ensure this matches your backend URL

// // Animation variants for the pulsating "thinking" dots
// const dotVariants = {
//   initial: { y: "0%" },
//   animate: { y: "100%" },
// };

// // Sample questions to guide the user
// const sampleQuestions = [
//   "What is the total stock on hand?",
//   "Show me products with low inventory.",
//   "What is the forecasted demand for next month?",
//   "Summarize the inventory status."
// ];

// const Chatbot = () => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [messages, setMessages] = useState([
//     { sender: 'bot', text: 'Hello! How can I help you with the inventory data today?' }
//   ]);
//   const [inputValue, setInputValue] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef(null);

// //   // Automatically scroll to the latest message
// //   useEffect(() => {
// //     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
// //   }, [messages, isLoading]);

// // Automatically scroll to the latest message
// useEffect(() => {
//     // Only attempt to scroll if the chat window is open.
//     if (isOpen) {
//         // Use a timeout to push the scroll event to the end of the execution queue.
//         // This ensures that the DOM has been fully painted (including animations)
//         // before we try to scroll, making it much more reliable.
//         setTimeout(() => {
//             messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//         }, 0);
//     }
// }, [messages, isLoading, isOpen]); // <-- Key change: added isOpen here

//   // Central function to handle sending a query
//   const submitQuery = useCallback(async (queryText) => {
//     if (!queryText || isLoading) return;

//     const userMessage = { sender: 'user', text: queryText };
//     setMessages(prev => [...prev, userMessage]);
//     setIsLoading(true);

//     try {
//       const token = localStorage.getItem("token");
//       const headers = { Authorization: `Bearer ${token}` };
//       const response = await axios.post(`${BASE_URL}/chat`, { query: queryText }, { headers });
//       const botMessage = { sender: 'bot', text: response.data.response || "I'm not sure how to respond to that." };
//       setMessages(prev => [...prev, botMessage]);
//     } catch (error) {
//       console.error("Chatbot API error:", error);
//       const errorMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [isLoading]); // Dependency on isLoading to prevent double-sends

//   const handleSendMessage = useCallback(() => {
//     const trimmedInput = inputValue.trim();
//     if (trimmedInput) {
//       submitQuery(trimmedInput);
//       setInputValue('');
//     }
//   }, [inputValue, submitQuery]);

//   const handleKeyPress = (e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       handleSendMessage();
//     }
//   };

//   return (
//     <>
//       {/* Floating Action Button */}
//       <AnimatePresence>
//         {!isOpen && (
//           <motion.button
//             initial={{ opacity: 0, scale: 0.8, y: 50 }}
//             animate={{
//               opacity: 1, scale: 1, y: 0,
//               transition: { type: "spring", stiffness: 260, damping: 20 }
//             }}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             exit={{ opacity: 0, scale: 0.8, y: 50 }}
//             onClick={() => setIsOpen(true)}
//             className="fixed bottom-6 right-6 z-[1001] p-4 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-full shadow-2xl shadow-black/30 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
//             aria-label="Open AI Assistant"
//           >
//             <motion.div
//               animate={{
//                 scale: [1, 1.1, 1],
//                 transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
//               }}
//             >
//               <FiMessageSquare size={24} />
//             </motion.div>
//           </motion.button>
//         )}
//       </AnimatePresence>

//       {/* Chat Window */}
//       <AnimatePresence>
//         {isOpen && (
//           <motion.div
//             initial={{ opacity: 0, y: 50, scale: 0.9 }}
//             animate={{ opacity: 1, y: 0, scale: 1 }}
//             exit={{ opacity: 0, y: 50, scale: 0.9 }}
//             transition={{ duration: 0.3, ease: "easeInOut" }}
//             className="fixed bottom-6 right-6 z-[1001] w-full max-w-sm h-[70vh] bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
//           >
//             {/* Header */}
//             <header className="flex items-center justify-between p-4 bg-slate-900/70 border-b border-slate-700 flex-shrink-0 backdrop-blur-sm">
//               <div className='flex items-center gap-3'>
//                 <FiCpu className="text-violet-400" size={22} />
//                 <h3 className="text-lg font-bold text-white">Akashvani</h3>
//               </div>
//               <motion.button
//                 whileHover={{ scale: 1.1, rotate: 90 }}
//                 whileTap={{ scale: 0.9 }}
//                 onClick={() => setIsOpen(false)}
//                 className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700"
//               >
//                 <FiX size={20} />
//               </motion.button>
//             </header>

//             {/* Messages Area */}
//             <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
//               {messages.map((msg, index) => (
//                 <motion.div
//                   key={index}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
//                 >
//                   {msg.sender === 'bot' && (
//                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>
//                   )}
//                   <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
//                     <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
//                   </div>
//                 </motion.div>
//               ))}

//               {/* Sample Questions */}
//               <AnimatePresence>
//                 {messages.length === 1 && (
//                   <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -20 }}
//                     transition={{ delay: 0.5 }}
//                     className="flex flex-wrap justify-center gap-2 pt-4"
//                   >
//                     {sampleQuestions.map((q, i) => (
//                       <motion.button
//                         key={i}
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         transition={{ delay: 0.7 + i * 0.1 }}
//                         onClick={() => submitQuery(q)}
//                         className="px-3 py-1.5 text-sm bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 transition-colors"
//                       >
//                         {q}
//                       </motion.button>
//                     ))}
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {isLoading && (
//                    <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className="flex items-end gap-2 justify-start"
//                    >
//                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>
//                      <div className="p-3 rounded-xl rounded-bl-none bg-slate-700 flex items-center justify-center space-x-1.5">
//                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                      </div>
//                    </motion.div>
//               )}
//               <div ref={messagesEndRef} />
//             </div>

//             {/* Input Area */}
//             <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex-shrink-0">
//               <div className="relative">
//                 <input
//                   type="text"
//                   value={inputValue}
//                   onChange={(e) => setInputValue(e.target.value)}
//                   onKeyPress={handleKeyPress}
//                   placeholder="Ask a question..."
//                   className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-4 pr-14 text-white placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-violet-500"
//                   disabled={isLoading}
//                 />
//                 <motion.button
//                   whileHover={{ scale: 1.1 }}
//                   whileTap={{ scale: 0.9 }}
//                   onClick={handleSendMessage}
//                   disabled={isLoading || !inputValue.trim()}
//                   aria-label="Send message"
//                   className="absolute right-2 top-0 bottom-0 my-auto flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-blue-600 text-white transition-all hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
//                 >
//                   <FiSend size={16} />
//                 </motion.button>
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default Chatbot;




// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import axios from 'axios';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FiMessageSquare, FiX, FiSend, FiCpu } from 'react-icons/fi';

// const BASE_URL = "http://localhost:5500";

// // Animation variants for the pulsating "thinking" dots
// const dotVariants = {
//     initial: { y: "0%" },
//     animate: { y: "100%" },
// };

// // Sample questions to guide the user
// const sampleQuestions = [
//     "What is the total stock on hand?",
//     "Show me products with low inventory.",
//     "What is the forecasted demand for next month?",
//     "Summarize the inventory status."
// ];

// const Chatbot = ({ mode = 'floating', isOpen: propIsOpen, onClose: propOnClose }) => {
//     const [internalIsOpen, setInternalIsOpen] = useState(false);
//     const [messages, setMessages] = useState([
//         { sender: 'bot', text: 'Hello! How can I help you with the inventory data today?' }
//     ]);
//     const [inputValue, setInputValue] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const messagesEndRef = useRef(null);

//     const isIntegrated = mode === 'integrated';
//     const isOpen = isIntegrated ? propIsOpen : internalIsOpen;
//     const handleClose = isIntegrated ? propOnClose : () => setInternalIsOpen(false);
//     const handleOpen = () => {
//         if (!isIntegrated) {
//             setInternalIsOpen(true);
//         }
//     };

//     useEffect(() => {
//         if (isOpen) {
//             setTimeout(() => {
//                 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//             }, 0);
//         }
//     }, [messages, isLoading, isOpen]);

//     const submitQuery = useCallback(async (queryText) => {
//         if (!queryText.trim() || isLoading) return;
//         const userMessage = { sender: 'user', text: queryText };
//         setMessages(prev => [...prev, userMessage]);
//         setInputValue('');
//         setIsLoading(true);

//         try {
//             const token = localStorage.getItem("token");
//             const headers = { Authorization: `Bearer ${token}` };
//             const response = await axios.post(`${BASE_URL}/chat`, { query: queryText }, { headers });
//             const botMessage = { sender: 'bot', text: response.data.response || "I'm not sure how to respond to that." };
//             setMessages(prev => [...prev, botMessage]);
//         } catch (error) {
//             console.error("Chatbot API error:", error);
//             const errorMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
//             setMessages(prev => [...prev, errorMessage]);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [isLoading]);

//     const handleSendMessage = useCallback(() => {
//         submitQuery(inputValue);
//     }, [inputValue, submitQuery]);

//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             handleSendMessage();
//         }
//     };

//     return (
//         <>
//             {/* --- RESTRUCTURED JSX for the button --- */}
//             <AnimatePresence>
//                 {!isIntegrated && !isOpen && (
//                     <motion.button
//                         initial={{ opacity: 0, scale: 0.8, y: 50 }}
//                         animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }}
//                         whileHover={{ scale: 1.1 }}
//                         whileTap={{ scale: 0.9 }}
//                         exit={{ opacity: 0, scale: 0.8, y: 50 }}
//                         onClick={handleOpen}
//                         className="fixed bottom-6 right-6 z-[1001] p-4 bg-gradient-to-br from-violet-600 to-blue-600 text-white rounded-full shadow-2xl shadow-black/30 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
//                         aria-label="Open AI Assistant"
//                     >
//                         <motion.div animate={{ scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" } }}>
//                             <FiMessageSquare size={24} />
//                         </motion.div>
//                     </motion.button>
//                 )}
//             </AnimatePresence>

//             {/* The main chat window renders if open, but its style depends on the mode */}
//             <AnimatePresence>
//                 {isOpen && (
//                     <motion.div
//                         initial={{ opacity: 0, y: 50, scale: 0.9 }}
//                         animate={{ opacity: 1, y: 0, scale: 1 }}
//                         exit={{ opacity: 0, y: 50, scale: 0.9 }}
//                         transition={{ duration: 0.3, ease: "easeInOut" }}
//                         className={
//                             isIntegrated
//                                 ? "w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
//                                 : "fixed bottom-6 right-6 z-[1001] w-full max-w-sm h-[70vh] bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
//                         }
//                     >
//                         <header className="flex items-center justify-between p-4 bg-slate-900/70 border-b border-slate-700 flex-shrink-0 backdrop-blur-sm">
//                             <div className='flex items-center gap-3'>
//                                 <FiCpu className="text-violet-400" size={22} />
//                                 <h3 className="text-lg font-bold text-white">Akashvani</h3>
//                             </div>
//                             <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={handleClose} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
//                                 <FiX size={20} />
//                             </motion.button>
//                         </header>
//                         <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
//                             {messages.map((msg, index) => (
//                                 <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
//                                     {msg.sender === 'bot' && (<div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>)}
//                                     <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
//                                         <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
//                                     </div>
//                                 </motion.div>
//                             ))}
//                             <AnimatePresence>
//                                 {messages.length === 1 && (
//                                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ delay: 0.5 }} className="flex flex-wrap justify-center gap-2 pt-4">
//                                         {sampleQuestions.map((q, i) => (
//                                             <motion.button key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.1 }} onClick={() => submitQuery(q)} className="px-3 py-1.5 text-sm bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
//                                                 {q}
//                                             </motion.button>
//                                         ))}
//                                     </motion.div>
//                                 )}
//                             </AnimatePresence>
//                             {isLoading && (
//                                 <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2 justify-start">
//                                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>
//                                     <div className="p-3 rounded-xl rounded-bl-none bg-slate-700 flex items-center justify-center space-x-1.5">
//                                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                                         <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                                     </div>
//                                 </motion.div>
//                             )}
//                             <div ref={messagesEndRef} />
//                         </div>
//                         <div className="p-4 border-t border-slate-700 bg-slate-900/50 flex-shrink-0">
//                             <div className="relative">
//                                 <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask a question..." className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-4 pr-14 text-white placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-violet-500" disabled={isLoading} />
//                                 <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} aria-label="Send message" className="absolute right-2 top-0 bottom-0 my-auto flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-blue-600 text-white transition-all hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
//                                     <FiSend size={16} />
//                                 </motion.button>
//                             </div>
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </>
//     );
// };

// export default Chatbot;





// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import axios from 'axios';
// import { motion, AnimatePresence } from 'framer-motion';
// import { FiX, FiSend, FiCpu } from 'react-icons/fi';

// const BASE_URL = "http://localhost:5500";

// // Animation variants for the pulsating "thinking" dots
// const dotVariants = {
//     initial: { y: "0%" },
//     animate: { y: "100%" },
// };

// // Sample questions to guide the user
// const sampleQuestions = [
//     "What is the total stock on hand?",
//     "Show me products with low inventory.",
//     "What is the forecasted demand for next month?",
//     "Summarize the inventory status."
// ];

// const Chatbot = ({ mode = 'floating', isOpen: propIsOpen, onClose: propOnClose }) => {
//     const [internalIsOpen, setInternalIsOpen] = useState(false);
//     const [messages, setMessages] = useState([
//         { sender: 'bot', text: 'Hello! How can I help you with the inventory data today?' }
//     ]);
//     const [inputValue, setInputValue] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const messagesEndRef = useRef(null);

//     const isFloating = mode === 'floating';
//     const isIntegrated = mode === 'integrated';
//     const isBar = mode === 'bar';

//     const isOpen = isIntegrated ? propIsOpen : (isFloating ? internalIsOpen : true);
//     const handleClose = isIntegrated ? propOnClose : () => setInternalIsOpen(false);
//     const handleOpen = () => {
//         if (isFloating) {
//             setInternalIsOpen(true);
//         }
//     };

//     const showMessages = !isBar || messages.length > 1;

//     useEffect(() => {
//         if (isOpen && showMessages) {
//             setTimeout(() => {
//                 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//             }, 100); // Small delay to allow for animation
//         }
//     }, [messages, isLoading, isOpen, showMessages]);

//     const submitQuery = useCallback(async (queryText) => {
//         if (!queryText.trim() || isLoading) return;
//         const userMessage = { sender: 'user', text: queryText };
//         setMessages(prev => [...prev, userMessage]);
//         setInputValue('');
//         setIsLoading(true);

//         try {
//             const token = localStorage.getItem("token");
//             const headers = { Authorization: `Bearer ${token}` };
//             const response = await axios.post(`${BASE_URL}/chat`, { query: queryText }, { headers });
//             const botMessage = { sender: 'bot', text: response.data.response || "I'm not sure how to respond to that." };
//             setMessages(prev => [...prev, botMessage]);
//         } catch (error) {
//             console.error("Chatbot API error:", error);
//             const errorMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
//             setMessages(prev => [...prev, errorMessage]);
//         } finally {
//             setIsLoading(false);
//         }
//     }, [isLoading]);

//     const handleSendMessage = useCallback(() => {
//         submitQuery(inputValue);
//     }, [inputValue, submitQuery]);

//     const handleKeyPress = (e) => {
//         if (e.key === 'Enter' && !e.shiftKey) {
//             e.preventDefault();
//             handleSendMessage();
//         }
//     };

//     const getContainerClasses = () => {
//         if (isBar) {
//             return "w-full max-w-2xl mx-auto my-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-xl flex flex-col overflow-hidden";
//         }
//         if (isIntegrated) {
//             return "w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden";
//         }
//         // Floating mode
//         return "fixed bottom-6 right-6 z-[1001] w-full max-w-sm h-[70vh] bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden";
//     };

//     return (
//         <>
//             {/* --- NEW: Floating Prompt Bar (replaces the old icon button) --- */}
//             <AnimatePresence>
//                 {isFloating && !isOpen && (
//                     <motion.div
//                         onClick={handleOpen}
//                         initial={{ opacity: 0, y: 50, scale: 0.9 }}
//                         animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }}
//                         exit={{ opacity: 0, y: 50, scale: 0.9 }}
//                         whileHover={{ scale: 1.05 }}
//                         whileTap={{ scale: 0.95 }}
//                         className="fixed bottom-6 right-6 z-[1001] w-full max-w-xs cursor-pointer"
//                         aria-label="Open AI Assistant"
//                     >
//                         <div className="p-3 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl shadow-black/30 flex items-center justify-between gap-3">
//                             <FiCpu className="text-violet-400 flex-shrink-0" size={20} />
//                             <span className="text-slate-300 text-sm font-medium w-full text-left">Ask Akashvani...</span>
//                             <div className="p-1.5 bg-gradient-to-br from-violet-600 to-blue-600 rounded-md text-white">
//                                 <FiSend size={14} />
//                             </div>
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>

//             {/* The main chat window/bar */}
//             <AnimatePresence>
//                 {isOpen && (
//                     <motion.div
//                         initial={{ opacity: 0, y: 50, scale: 0.95 }}
//                         animate={{ opacity: 1, y: 0, scale: 1 }}
//                         exit={{ opacity: 0, y: 50, scale: 0.95 }}
//                         transition={{ duration: 0.3, ease: "easeInOut" }}
//                         className={getContainerClasses()}
//                         style={isBar ? { maxHeight: '70vh' } : {}}
//                     >
//                         {/* The header is hidden in 'bar' mode */}
//                         {!isBar && (
//                             <header className="flex items-center justify-between p-4 bg-slate-900/70 border-b border-slate-700 flex-shrink-0 backdrop-blur-sm">
//                                 <div className='flex items-center gap-3'>
//                                     <FiCpu className="text-violet-400" size={22} />
//                                     <h3 className="text-lg font-bold text-white">Akashvani</h3>
//                                 </div>
//                                 <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={handleClose} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
//                                     <FiX size={20} />
//                                 </motion.button>
//                             </header>
//                         )}
                        
//                         <AnimatePresence>
//                         {showMessages && (
//                             <motion.div
//                                 initial={{ opacity: 0, height: 0 }}
//                                 animate={{ opacity: 1, height: 'auto' }}
//                                 exit={{ opacity: 0, height: 0 }}
//                                 transition={{ duration: 0.4, ease: "easeInOut" }}
//                                 className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
//                             >
//                                 {messages.map((msg, index) => (
//                                     <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
//                                         {msg.sender === 'bot' && (<div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>)}
//                                         <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
//                                             <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
//                                         </div>
//                                     </motion.div>
//                                 ))}
//                                 {isLoading && (
//                                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2 justify-start">
//                                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>
//                                         <div className="p-3 rounded-xl rounded-bl-none bg-slate-700 flex items-center justify-center space-x-1.5">
//                                             <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                                             <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                                             <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
//                                         </div>
//                                     </motion.div>
//                                 )}
//                                 <div ref={messagesEndRef} />
//                             </motion.div>
//                         )}
//                         </AnimatePresence>
                        
//                         <AnimatePresence>
//                             {messages.length === 1 && (
//                                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }} className={`flex flex-wrap justify-center gap-2 p-4 ${isBar ? 'pt-4' : 'pt-0'}`}>
//                                     {sampleQuestions.map((q, i) => (
//                                         <motion.button key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }} onClick={() => submitQuery(q)} className="px-3 py-1.5 text-sm bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
//                                             {q}
//                                         </motion.button>
//                                     ))}
//                                 </motion.div>
//                             )}
//                         </AnimatePresence>
                        
//                         <div className={`p-4 flex-shrink-0 ${isBar && messages.length === 1 ? 'bg-transparent' : 'border-t border-slate-700 bg-slate-900/50'}`}>
//                             <div className="relative">
//                                 <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask a question..." className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-4 pr-14 text-white placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-violet-500" disabled={isLoading} />
//                                 <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} aria-label="Send message" className="absolute right-2 top-0 bottom-0 my-auto flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-blue-600 text-white transition-all hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
//                                     <FiSend size={16} />
//                                 </motion.button>
//                             </div>
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>
//         </>
//     );
// };

// export default Chatbot;




import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSend, FiCpu } from 'react-icons/fi';

const BASE_URL = "http://localhost:5500";

// Animation variants for the pulsating "thinking" dots
const dotVariants = {
    initial: { y: "0%" },
    animate: { y: "100%" },
};

// --- MODIFICATION 1: Moved sample questions to a default constant ---
// These will be used as a fallback if no specific questions are provided.
const defaultSampleQuestions = [
    "What is the total stock on hand?",
    "Show me products with low inventory.",
    "What is the forecasted demand for next month?",
    "Summarize the inventory status."
];

// --- MODIFICATION 2: Added the `questions` prop ---
const Chatbot = ({ mode = 'floating', isOpen: propIsOpen, onClose: propOnClose, questions }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Hello! How can I help you with the inventory data today?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // --- MODIFICATION 3: Logic to decide which questions to show ---
    // If the 'questions' prop is provided and not empty, use it. Otherwise, use the default.
    const questionsToShow = questions && questions.length > 0 ? questions : defaultSampleQuestions;


    const isFloating = mode === 'floating';
    const isIntegrated = mode === 'integrated';
    const isBar = mode === 'bar';

    const isOpen = isIntegrated ? propIsOpen : (isFloating ? internalIsOpen : true);
    const handleClose = isIntegrated ? propOnClose : () => setInternalIsOpen(false);
    const handleOpen = () => {
        if (isFloating) {
            setInternalIsOpen(true);
        }
    };

    const showMessages = !isBar || messages.length > 1;

    useEffect(() => {
        if (isOpen && showMessages) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, isLoading, isOpen, showMessages]);

    const submitQuery = useCallback(async (queryText) => {
        if (!queryText.trim() || isLoading) return;
        const userMessage = { sender: 'user', text: queryText };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");
            const headers = { Authorization: `Bearer ${token}` };
            const response = await axios.post(`${BASE_URL}/chat`, { query: queryText }, { headers });
            const botMessage = { sender: 'bot', text: response.data.response || "I'm not sure how to respond to that." };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Chatbot API error:", error);
            const errorMessage = { sender: 'bot', text: "Sorry, I'm having trouble connecting. Please try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading]);

    const handleSendMessage = useCallback(() => {
        submitQuery(inputValue);
    }, [inputValue, submitQuery]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const getContainerClasses = () => {
        if (isBar) {
            return "w-full max-w-2xl mx-auto my-8 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-xl flex flex-col overflow-hidden";
        }
        if (isIntegrated) {
            return "w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden";
        }
        // Floating mode
        return "fixed bottom-6 right-6 z-[1001] w-full max-w-sm h-[70vh] bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden";
    };

    return (
        <>
            {/* Floating Prompt Bar (unchanged) */}
            <AnimatePresence>
                {isFloating && !isOpen && (
                    <motion.div
                        onClick={handleOpen}
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-[1001] w-full max-w-xs cursor-pointer"
                        aria-label="Open AI Assistant"
                    >
                        <div className="p-3 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl shadow-black/30 flex items-center justify-between gap-3">
                            <FiCpu className="text-violet-400 flex-shrink-0" size={20} />
                            <span className="text-slate-300 text-sm font-medium w-full text-left">Ask Akashvani...</span>
                            <div className="p-1.5 bg-gradient-to-br from-violet-600 to-blue-600 rounded-md text-white">
                                <FiSend size={14} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The main chat window/bar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={getContainerClasses()}
                        style={isBar ? { maxHeight: '70vh' } : {}}
                    >
                        {/* Header (unchanged) */}
                        {!isBar && (
                             <header className="flex items-center justify-between p-4 bg-slate-900/70 border-b border-slate-700 flex-shrink-0 backdrop-blur-sm">
                                <div className='flex items-center gap-3'>
                                    <FiCpu className="text-violet-400" size={22} />
                                    <h3 className="text-lg font-bold text-white">Akashvani</h3>
                                </div>
                                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={handleClose} className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
                                    <FiX size={20} />
                                </motion.button>
                            </header>
                        )}
                        
                        {/* Messages Area (unchanged) */}
                        <AnimatePresence>
                            {showMessages && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                                >
                                    {messages.map((msg, index) => (
                                        <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            {msg.sender === 'bot' && (<div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>)}
                                            <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                                <p style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {isLoading && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-2 justify-start">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex-shrink-0"></div>
                                            <div className="p-3 rounded-xl rounded-bl-none bg-slate-700 flex items-center justify-center space-x-1.5">
                                                <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                                <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                                <motion.span variants={dotVariants} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: 0.4 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* --- MODIFICATION 4: Map over `questionsToShow` --- */}
                        <AnimatePresence>
                            {messages.length === 1 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.5 }} className={`flex flex-wrap justify-center gap-2 p-4 ${isBar ? 'pt-4' : 'pt-0'}`}>
                                    {questionsToShow.map((q, i) => (
                                        <motion.button key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.1 }} onClick={() => submitQuery(q)} className="px-3 py-1.5 text-sm bg-slate-700/50 text-slate-300 rounded-full hover:bg-slate-700 transition-colors">
                                            {q}
                                        </motion.button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        {/* Input Area (unchanged) */}
                        <div className={`p-4 flex-shrink-0 ${isBar && messages.length === 1 ? 'bg-transparent' : 'border-t border-slate-700 bg-slate-900/50'}`}>
                            <div className="relative">
                                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Ask a question..." className="w-full bg-slate-700 border border-slate-600 rounded-lg py-3 pl-4 pr-14 text-white placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-violet-500" disabled={isLoading} />
                                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} aria-label="Send message" className="absolute right-2 top-0 bottom-0 my-auto flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-blue-600 text-white transition-all hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
                                    <FiSend size={16} />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Chatbot;