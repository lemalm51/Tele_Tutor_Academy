import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../../component/educator/Navbar";
import Sidebar from "../../component/educator/Sidbar";
import Footer from "../../component/educator/Footer";
import BecomeEducator from "./BecomeEducator";
import { AppContext } from "../../context/AppContext";

const Educator = () => {
	const { isEducator, userData } = useContext(AppContext);

	// If user is not an educator, show BecomeEducator component
	if (!isEducator && userData?.role !== 'educator') {
		return (
			<div className="text-default min-h-screen bg-white">
				<Navbar />
				<BecomeEducator />
				<Footer />
			</div>
		);
	}

	// If user is an educator, show the full educator dashboard
	return (
		<div className="text-default min-h-screen bg-white">
			<Navbar />
			<div className="flex">
				<Sidebar />
				<div className="flex-1">{<Outlet />}</div>
			</div>
			<Footer />
		</div>
	);
};

export default Educator;
