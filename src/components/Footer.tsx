
import React from 'react';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '#features' },
        { name: 'How It Works', href: '#how-it-works' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'FAQ', href: '#faq' },
      ]
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Blog', href: '#' },
        { name: 'Contact', href: '#' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { name: 'Help Center', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Cookie Policy', href: '#' },
      ]
    }
  ];

  const socialLinks = [
    { icon: <Facebook size={20} />, href: '#' },
    { icon: <Twitter size={20} />, href: '#' },
    { icon: <Instagram size={20} />, href: '#' },
    { icon: <Linkedin size={20} />, href: '#' },
    { icon: <Github size={20} />, href: '#' }
  ];

  return (
    <footer className="bg-gray-50 pt-16 pb-8">
      <div className="axion-container">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          <div className="md:col-span-2">
            <a href="#" className="inline-block mb-6">
              <span className="text-2xl font-bold axion-text-gradient">Axion AI</span>
            </a>
            <p className="text-gray-600 mb-6 max-w-sm">
              Transform videos, documents, or any topic into interactive quizzes. Boost your learning with our AI-powered quiz generator.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, i) => (
                <a 
                  key={i} 
                  href={link.href}
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors"
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
          
          {footerLinks.map((group, i) => (
            <div key={i}>
              <h3 className="font-semibold text-gray-800 mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link, j) => (
                  <li key={j}>
                    <a href={link.href} className="text-gray-600 hover:text-primary transition-colors">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm mb-4 md:mb-0">
            © {currentYear} Axion AI. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-500 hover:text-primary text-sm">Privacy Policy</a>
            <a href="#" className="text-gray-500 hover:text-primary text-sm">Terms of Service</a>
            <a href="#" className="text-gray-500 hover:text-primary text-sm">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
