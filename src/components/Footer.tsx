import React from 'react';
import { translations } from '../translations';

interface FooterProps {
  language: 'en' | 'vi';
}

export default function Footer({ language }: FooterProps) {
  const t = translations[language];

  return (
    <footer className="footer-site" id="footer-site">
      <div className="footer-top" id="footer-top">
        <div className="footer-brand-section" id="footer-brand">
          <h3 className="footer-slogan" id="footer-slogan" style={{ whiteSpace: 'pre-line' }}>
            {t.footer.slogan}
          </h3>
        </div>
        
        <div className="footer-newsletter" id="footer-newsletter">
          <span className="newsletter-title" id="newsletter-title">{t.footer.getInTouch}</span>
          <form className="newsletter-form" id="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Enter your email" className="newsletter-input" id="newsletter-email" required />
            <button type="submit" className="newsletter-btn" id="newsletter-submit">{t.footer.subscribeBtn}</button>
          </form>
        </div>
      </div>

      <div className="footer-mid" id="footer-mid">
        <div className="footer-col" id="footer-col-contact">
          <span className="footer-col-title" id="title-contact">{t.footer.contactTitle}</span>
          <div className="footer-contact-item" id="contact-email">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <a href="mailto:support@lubpy.com">support@lubpy.com</a>
          </div>
          <div className="footer-contact-item" id="contact-phone">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="contact-icon">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>1800-3232-8686</span>
          </div>
        </div>

        <div className="footer-col" id="footer-col-company">
          <span className="footer-col-title" id="title-company">{t.footer.companyTitle}</span>
          <a href="#about" className="footer-col-link">{t.footer.features}</a>
          <a href="#about" className="footer-col-link">{t.footer.aboutUs}</a>
          <a href="#faqs" className="footer-col-link">{t.footer.contact}</a>
          <a href="#process-pricing" className="footer-col-link">{t.footer.pricing}</a>
        </div>

        <div className="footer-col" id="footer-col-help">
          <span className="footer-col-title" id="title-help">{t.footer.helpTitle}</span>
          <a href="#faqs" className="footer-col-link">{t.footer.faq}</a>
          <a href="#faqs" className="footer-col-link">{t.footer.helpCenter}</a>
          <a href="#faqs" className="footer-col-link">{t.footer.support}</a>
        </div>

        <div className="footer-col" id="footer-col-follow">
          <span className="footer-col-title" id="title-follow">{t.footer.followTitle}</span>
          <div className="footer-social-icons" id="footer-social-group">
            <a href="#" className="footer-social-round-btn" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
              </svg>
            </a>
            <a href="#" className="footer-social-round-btn" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="#" className="footer-social-round-btn" aria-label="LinkedIn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom" id="footer-bottom">
        <span className="footer-copyright" id="footer-copyright">{t.footer.copyright}</span>
        <div className="footer-bottom-links" id="footer-bottom-links">
          <a href="#">{t.footer.privacy}</a>
          <a href="#">{t.footer.terms}</a>
        </div>
      </div>
    </footer>
  );
}

