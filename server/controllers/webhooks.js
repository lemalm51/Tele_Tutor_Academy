import { Webhook } from "svix";
import User from "../models/User.js";

export const clerkWebhooks = async (req, res) => {
    try {
        if (!process.env.CLERK_WEBHOOK_SECRET) {
            console.log("❌ CLERK_WEBHOOK_SECRET not configured");
            return res.status(500).json({ success: false, message: "Webhook secret not configured" });
        }

        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
        
        // Get the raw body
        const payload = req.body.toString();
        const headers = {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        };

        const evt = whook.verify(payload, headers);
        const { data, type } = evt;

        console.log(`🔔 Webhook received: ${type}`, data.id);

        switch (type) {
            case 'user.created': {
                const userData = {
                    _id: data.id,
                    email: data.email_addresses?.[0]?.email_address || "",
                    name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
                    imageUrl: data.image_url || "",
                    role: data.public_metadata?.role || 'student'
                };
                await User.create(userData);
                break;
            }

            case 'user.updated': {
                const userData = {
                    email: data.email_addresses?.[0]?.email_address || "",
                    name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User",
                    imageUrl: data.image_url || "",
                    role: data.public_metadata?.role || 'student'
                };
                await User.findByIdAndUpdate(data.id, userData);
                break;
            }

            case 'user.deleted': {
                await User.findByIdAndDelete(data.id);
                break;
            }

            default:
                console.log(`Unhandled event type: ${type}`);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};