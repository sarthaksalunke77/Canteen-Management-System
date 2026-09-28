// generate_ppt.js
const PPTXGenJS = require('pptxgenjs');
let pptx = new PPTXGenJS();

// Title slide
pptx.addSlide().addText('CMS Canteen QR Code Feature', {
  x:1, y:1.5, w:'80%', h:1,
  fontSize:36, bold:true, color:'363636', align:'center'
});

// Overview slide
let slide2 = pptx.addSlide();
slide2.addText('Overview', {x:0.5, y:0.5, fontSize:28, bold:true});
slide2.addText('- Admin QR generation (download/print)\n- Customer QR scan with table pre‑fill\n- Premium UI with glassmorphism', {x:0.5, y:1.2, fontSize:18, lineSpacing:24});

// Screenshots slide - Admin QR Grid
let slide3 = pptx.addSlide();
slide3.addText('Admin QR Grid', {x:0.5, y:0.2, fontSize:24, bold:true});
slide3.addImage({path:'C:/Users/salun/.gemini/antigravity/brain/e47710ce-19e1-4a97-b823-010ac3089909/qr_codes_generated_1775241701281.png', x:0.5, y:0.8, w:9, h:5});

// Welcome Banner after Scan
let slide4 = pptx.addSlide();
slide4.addText('Welcome Banner after Scan', {x:0.5, y:0.2, fontSize:24, bold:true});
slide4.addImage({path:'C:/Users/salun/.gemini/antigravity/brain/e47710ce-19e1-4a97-b823-010ac3089909/welcome_banner_table_3_1775241363028.png', x:0.5, y:0.8, w:9, h:5});

// Checkout Pre‑fill
let slide5 = pptx.addSlide();
slide5.addText('Checkout Pre‑fill', {x:0.5, y:0.2, fontSize:24, bold:true});
slide5.addImage({path:'C:/Users/salun/.gemini/antigravity/brain/e47710ce-19e1-4a97-b823-010ac3089909/checkout_prefill_verification_1775241398443.png', x:0.5, y:0.8, w:9, h:5});

// Save PPTX
pptx.writeFile({ fileName: 'QR_Feature_Presentation.pptx' });
