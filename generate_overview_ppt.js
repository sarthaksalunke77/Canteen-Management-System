const PPTXGenJS = require('pptxgenjs');
let pptx = new PPTXGenJS();

pptx.layout = 'LAYOUT_16x9';

// Define master slide or default styling
pptx.defineSlideMaster({
  title: 'MASTER_SLIDE',
  bkgd: 'FFFFFF',
  objects: [
    { rect: { x: 0, y: 0, w: '100%', h: 0.8, fill: '003366' } },
    { text: { text: 'Canteen Management System', options: { x: 0.5, y: 0.2, w: 8, h: 0.4, color: 'FFFFFF', fontSize: 20, bold: true } } }
  ]
});

// Title slide
let slide1 = pptx.addSlide();
slide1.bkgd = '003366';
slide1.addText('Canteen Management System (CMS)', {
  x: 0, y: 2, w: '100%', h: 1,
  fontSize: 44, bold: true, color: 'FFFFFF', align: 'center'
});
slide1.addText('Project Overview & Architecture', {
  x: 0, y: 3, w: '100%', h: 0.5,
  fontSize: 24, color: 'D3D3D3', align: 'center'
});

// Slide 1: Project Overview
let slide2 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide2.addText('1. Project Overview', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide2.addText([
  { text: '• A web-based application to automate and smooth operations of a modern canteen.', options: { bullet: true } },
  { text: '• Addresses challenges of slow and error-prone manual processes.', options: { bullet: true } },
  { text: '• Provides separate interfaces for customers and administrators.', options: { bullet: true } },
  { text: '• Customers: View, order, and pay seamlessly.', options: { bullet: true } },
  { text: '• Administrators: Manage menus, monitor orders, and view financial reports.', options: { bullet: true } }
], { x: 0.5, y: 1.8, w: '90%', h: 3, fontSize: 18, color: '363636', lineSpacing: 32 });

// Slide 2: Problem Statement
let slide3 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide3.addText('2. Problem Statement', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide3.addText([
  { text: '• Poor Service & Long Queues: Manual processes lead to long waiting hours.', options: { bullet: true } },
  { text: '• Financial Errors: Hand-written orders and cash transactions lead to incorrect billing.', options: { bullet: true } },
  { text: '• Order Chaos: Lack of instant digital display for current orders being prepared.', options: { bullet: true } },
  { text: '• Slow Report Generation: Manual collection and counting takes incredible time.', options: { bullet: true } }
], { x: 0.5, y: 1.8, w: '90%', h: 3, fontSize: 18, color: '363636', lineSpacing: 32 });

// Slide 3: Core Objectives & Proposed Solution
let slide4 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide4.addText('3. Core Objectives & Proposed Solution', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide4.addText([
  { text: '• Customer Focus: Responsive, self-service portal (view menu, order, pay).', options: { bullet: true } },
  { text: '• Cashless Transactions: Secure wallet deduction & simulated Razorpay integration.', options: { bullet: true } },
  { text: '• Admin Control: Real-time order tracking for efficient workflows.', options: { bullet: true } },
  { text: '• Data-Driven Management: Automated sales reporting & AI forecasting.', options: { bullet: true } }
], { x: 0.5, y: 1.8, w: '90%', h: 3, fontSize: 18, color: '363636', lineSpacing: 32 });

// Slide 4: System Architecture & Technologies
let slide5 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide5.addText('4. System Architecture & Technologies', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide5.addText([
  { text: '• Front-end: HTML 5, CSS 3, JavaScript', options: { bullet: true } },
  { text: '• Back-end: Node.js with Express.js', options: { bullet: true } },
  { text: '• Data Persistence (Prototype): Browser localStorage API / SQLite', options: { bullet: true } },
  { text: '• Future Database: PostgreSQL', options: { bullet: true } },
  { text: '• External Tools: Razorpay SDK (Simulation)', options: { bullet: true } }
], { x: 0.5, y: 1.8, w: '90%', h: 3, fontSize: 18, color: '363636', lineSpacing: 32 });

// Slide 5: Core Functional Requirements
let slide6 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide6.addText('5. Core Functional Requirements', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide6.addText([
  { text: '• Order Processing: Full-cycle from item selection to receipt generation.', options: { bullet: true } },
  { text: '• Financial Management: Wallet transactions & simulated online payment.', options: { bullet: true } },
  { text: '• Admin & Menu CRUD: Create, read, update, delete menu items and user accounts.', options: { bullet: true } },
  { text: '• Real-time Tracking: KDS system for crew (New → Preparing → Ready).', options: { bullet: true } },
  { text: '• Business Intelligence: AI-based forecasting for proactive inventory planning.', options: { bullet: true } }
], { x: 0.5, y: 1.8, w: '90%', h: 3, fontSize: 18, color: '363636', lineSpacing: 32 });

// Slide 6: Results & Conclusion
let slide7 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide7.addText('6. Results & Conclusion', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide7.addText([
  { text: '• 90% Faster Service: Order & payment time reduced from 2-4 mins to 10-30 secs.', options: { bullet: true } },
  { text: '• Real-time Insight: Report generation reduced to under 5 seconds.', options: { bullet: true } },
  { text: '• Functional Success: Reliable prototype with consistent data, ready for future migration.', options: { bullet: true } },
  { text: '• Conclusion: A robust blueprint to transition from manual to fast, automated service.', options: { bullet: true } }
], { x: 0.5, y: 1.8, w: '90%', h: 3, fontSize: 18, color: '363636', lineSpacing: 32 });

// Slide 7: Future Scope and Enhancements
let slide8 = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
slide8.addText('7. Future Scope & Enhancements', { x: 0.5, y: 1.0, fontSize: 32, bold: true, color: '003366' });
slide8.addText([
  { text: '• Scalability: Migrate from localStorage/SQLite to PostgreSQL.', options: { bullet: true } },
  { text: '• Security: Password hashing, JWT authentication, and secure login.', options: { bullet: true } },
  { text: '• Operations: Real-time inventory tracking and improved intelligence analytics.', options: { bullet: true } },
  { text: '• Goal: Realize a secure, scalable, and commercially viable digital solution.', options: { bullet: true } }
], { x: 0.5, y: 1.8, w: '90%', h: 3, fontSize: 18, color: '363636', lineSpacing: 32 });

// Save PPTX
pptx.writeFile({ fileName: 'CMS_Project_Overview.pptx' }).then(() => {
  console.log("Presentation generated successfully: CMS_Project_Overview.pptx");
});
