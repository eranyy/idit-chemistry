require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(__dirname));

// The securely stored API keys
const adminKey = process.env.ADMIN_KEY;
const iditKey = process.env.IDIT_KEY;

app.post('/api/contact', async (req, res) => {
    try {
        const { subject, name, message, formType } = req.body;

        const fromName = formType === 'review' ? "אתר עידית כימיה - המלצות" : "אתר עידית כימיה - פניות";

        if (!adminKey) {
            console.error("Missing ADMIN_KEY in environment variables.");
            return res.status(500).json({ success: false, message: 'Server misconfiguration' });
        }

        // Dispatch to Admin
        const adminResponse = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                access_key: adminKey,
                subject: subject,
                from_name: fromName,
                name: name,
                email: "no-reply@idit-chemistry.co.il",
                message: message
            })
        });

        // Dispatch to Idit if key is available
        if (iditKey) {
            await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    access_key: iditKey,
                    subject: subject,
                    from_name: fromName,
                    name: name,
                    email: "no-reply@idit-chemistry.co.il",
                    message: message
                })
            });
        }

        if (adminResponse.ok) {
            res.status(200).json({ success: true, message: 'Form submitted successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Failed to submit form' });
        }
    } catch (error) {
        console.error("Proxy dispatch error:", error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// For any other route, serve index.html (SPA support if needed)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
