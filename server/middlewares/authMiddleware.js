// Middleware (protect educator route) - UPDATED FOR MOCK AUTH
export const protectEducator = async (req, res, next) => {
    try {
        const auth = req.auth;
        
        // Check mock auth first
        if (auth && auth.publicMetadata && auth.publicMetadata.role === 'educator') {
            console.log("✅ Mock educator access granted");
            return next();
        }

        // If no mock auth, check real Clerk (for production)
        const userId = auth?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized Access!" });
        }

        // This would check real Clerk in production
        // const response = await clerkClient.users.getUser(userId);
        // if (response.publicMetadata.role !== 'educator') {
        //     return res.status(403).json({ success: false, message: "Educator access required!" });
        // }

        // For now, allow all authenticated users in development
        console.log("🔧 Development mode - educator check bypassed");
        next();

    } catch (error) {
        console.error("❌ Auth middleware error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}