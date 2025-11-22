"use client";
import { useState, useEffect } from "react";

export default function Logger() {
	const [visitors, setVisitors] = useState(0);

	useEffect(() => {
		async function initLogger() {
			try {
				const body = {
					method: "POST",
					headers: {
						"content-type": "application/json",
					},
					body: JSON.stringify({
						clientSecret: "7284daa1-9273-4065-ab8e-61a245a24956",
						applicationId: "60f8af1b-0ab7-42eb-9791-8be92f36da4e",
					}),
				};
				
				const res = await fetch(
					"https://logger-mocha-six.vercel.app/api/logger/v1",
					body
				);
				
				if (res.ok) {
					const json = await res.json();
					setVisitors(json);
				} else {
					console.error("Logger API error:", res.status);
					setVisitors(0); // Set default value on error
				}
			} catch (error) {
				console.error("Logger fetch error:", error);
				setVisitors(0); // Set default value on error
			}
		}
		initLogger();
	}, []);
	
	return (
		<div className="w-fit m-auto font-semibold gap-3 bg-gradient-to-b from-cyan-100/20 text-lg sm:text-xs p-3 sm:p-2 rounded-md shadow-md z-50">
			Visitors: <span className="text-green-500"> {visitors} </span>
		</div>
	);
}