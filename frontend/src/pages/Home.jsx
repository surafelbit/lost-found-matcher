import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-xl flex flex-col gap-xl">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-lg py-xl">
          <h1 className="font-display-lg text-display-lg text-primary max-w-3xl">
            Lost something? We're here to help.
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            The fastest way to reunite with your belongings on campus. Report a lost item or log something you've found.
          </p>
          <div className="flex flex-col sm:flex-row gap-md mt-sm w-full max-w-2xl justify-center">
            {/* Action Card 1: Lost */}
            <button onClick={() => navigate(user ? "/submit" : "/login")} className="flex-1 bg-primary text-on-primary rounded-xl p-md flex flex-col items-center gap-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <div className="bg-primary-container p-3 rounded-full group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-inverse-primary" style={{fontVariationSettings: "'FILL' 1"}}>search</span>
              </div>
              <span className="font-headline-md text-headline-md">I Lost an Item</span>
              <span className="font-body-md text-body-md text-tertiary-fixed-dim opacity-80">File a report to start looking</span>
            </button>
            {/* Action Card 2: Found */}
            <button onClick={() => navigate(user ? "/submit" : "/login")} className="flex-1 bg-secondary-container text-on-secondary-fixed rounded-xl p-md flex flex-col items-center gap-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
              <div className="bg-secondary-fixed-dim p-3 rounded-full group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-on-secondary-fixed-variant" style={{fontVariationSettings: "'FILL' 1"}}>volunteer_activism</span>
              </div>
              <span className="font-headline-md text-headline-md">I Found an Item</span>
              <span className="font-body-md text-body-md text-on-secondary-fixed-variant opacity-80">Turn it in to help someone out</span>
            </button>
          </div>
        </section>

        {/* Recent Found Items */}
        <section className="flex flex-col gap-md">
          <div className="flex justify-between items-end">
            <h2 className="font-headline-lg text-headline-lg text-primary">Recently Found (Mock Data)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {/* Card 1 */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden hover:shadow-[0px_4px_12px_rgba(26,54,93,0.08)] transition-shadow duration-300 flex flex-col group">
              <div className="w-full pt-[75%] relative bg-surface-container-low">
                <img src="https://ts3.mm.bing.net/th?id=OIP.azA6GX2HkHFyCinJlSJkMQHaJM&pid=15.1" alt="MacBook" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-sm right-sm bg-surface-container-lowest/90 backdrop-blur-sm rounded-full p-2 text-primary shadow-sm">
                  <span className="material-symbols-outlined">laptop_mac</span>
                </div>
              </div>
              <div className="p-md flex flex-col gap-xs">
                <h3 className="font-headline-md text-headline-md text-on-background line-clamp-1">Silver MacBook Pro</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Found in Main Library, 2nd Floor</p>
                <div className="mt-xs pt-xs border-t border-surface-variant flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-outline">Today, 10:30 AM</span>
                  <span className="bg-surface-container-low text-primary px-2 py-1 rounded-[0.25rem] font-label-sm text-label-sm">Electronics</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden hover:shadow-[0px_4px_12px_rgba(26,54,93,0.08)] transition-shadow duration-300 flex flex-col group">
              <div className="w-full pt-[75%] relative bg-surface-container-low">
                <img src="https://thumbs.dreamstime.com/b/laptop-outside-concept-laptop-outside-concept-empty-copy-space-blank-screen-mockup-soft-focus-laptop-nature-background-ecology-184872930.jpg" alt="Keys" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-sm right-sm bg-surface-container-lowest/90 backdrop-blur-sm rounded-full p-2 text-primary shadow-sm">
                  <span className="material-symbols-outlined">key</span>
                </div>
              </div>
              <div className="p-md flex flex-col gap-xs">
                <h3 className="font-headline-md text-headline-md text-on-background line-clamp-1">Keys with Blue Lanyard</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Found near Student Union</p>
                <div className="mt-xs pt-xs border-t border-surface-variant flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-outline">Yesterday, 4:15 PM</span>
                  <span className="bg-surface-container-low text-primary px-2 py-1 rounded-[0.25rem] font-label-sm text-label-sm">Personal</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden hover:shadow-[0px_4px_12px_rgba(26,54,93,0.08)] transition-shadow duration-300 flex flex-col group">
              <div className="w-full pt-[75%] relative bg-surface-container-low">
                <img src="https://ts3.mm.bing.net/th?id=OIP.JFAbdbd2o_JfGckENrBkOQHaE7&pid=15.1&w=519&h=345&c=7&rs=1" alt="Water Bottle" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute top-sm right-sm bg-surface-container-lowest/90 backdrop-blur-sm rounded-full p-2 text-primary shadow-sm">
                  <span className="material-symbols-outlined">water_bottle</span>
                </div>
              </div>
              <div className="p-md flex flex-col gap-xs">
                <h3 className="font-headline-md text-headline-md text-on-background line-clamp-1">Navy Yeti Water Bottle</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">Found in Science Hall Room 302</p>
                <div className="mt-xs pt-xs border-t border-surface-variant flex justify-between items-center">
                  <span className="font-label-sm text-label-sm text-outline">Yesterday, 1:00 PM</span>
                  <span className="bg-surface-container-low text-primary px-2 py-1 rounded-[0.25rem] font-label-sm text-label-sm">Accessories</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Your Active Reports Section */}
        <section className="flex flex-col gap-md pb-xl">
          <h2 className="font-headline-lg text-headline-lg text-primary">Your Active Reports</h2>
          <div className="bg-surface-container-lowest border border-surface-variant rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-variant bg-surface-container-low/50">
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold">Item</th>
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold">Date Reported</th>
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold">Type</th>
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold">Status</th>
                    <th className="p-sm font-label-md text-label-md text-on-surface-variant font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1 */}
                  <tr className="border-b border-surface-variant hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-sm">
                      <div className="flex items-center gap-xs">
                        <div className="p-2 bg-surface-container-low rounded-[0.25rem] text-on-surface-variant">
                          <span className="material-symbols-outlined" style={{fontSize: "20px"}}>book</span>
                        </div>
                        <span className="font-body-md text-body-md font-medium text-on-background">Calculus Textbook</span>
                      </div>
                    </td>
                    <td className="p-sm font-body-md text-body-md text-on-surface-variant">Oct 12, 2023</td>
                    <td className="p-sm font-body-md text-body-md text-on-surface-variant">Lost</td>
                    <td className="p-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">
                        Potential Match
                      </span>
                    </td>
                    <td className="p-sm text-right">
                      <button className="text-primary hover:text-tertiary-container font-label-md text-label-md transition-colors">Review</button>
                    </td>
                  </tr>
                  {/* Row 2 */}
                  <tr className="hover:bg-surface-container-lowest/50 transition-colors">
                    <td className="p-sm">
                      <div className="flex items-center gap-xs">
                        <div className="p-2 bg-surface-container-low rounded-[0.25rem] text-on-surface-variant">
                          <span className="material-symbols-outlined" style={{fontSize: "20px"}}>headphones</span>
                        </div>
                        <span className="font-body-md text-body-md font-medium text-on-background">AirPods Pro Case</span>
                      </div>
                    </td>
                    <td className="p-sm font-body-md text-body-md text-on-surface-variant">Oct 10, 2023</td>
                    <td className="p-sm font-body-md text-body-md text-on-surface-variant">Lost</td>
                    <td className="p-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-on-surface-variant font-label-sm text-label-sm">
                        Searching
                      </span>
                    </td>
                    <td className="p-sm text-right">
                      <button className="text-primary hover:text-tertiary-container font-label-md text-label-md transition-colors">Details</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Component */}
      <footer className="bg-surface-container-low dark:bg-surface-container-lowest full-width border-t border-outline-variant dark:border-outline flat no shadows mt-auto">
        <div className="w-full py-xl px-gutter flex flex-col md:flex-row justify-between items-center max-w-container-max mx-auto gap-sm">
          <div className="font-headline-md text-headline-md font-bold text-primary flex flex-col items-center md:items-start gap-xs">
            UniFound
            <span className="font-label-sm text-label-sm text-on-surface-variant font-normal">© 2024 University Lost and Found. Managed by Campus Security.</span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-md">
            <a className="text-on-surface-variant dark:text-surface-variant font-label-md text-label-md hover:text-primary dark:hover:text-primary-fixed-dim transition-opacity hover:opacity-80" href="#">Contact Support</a>
            <a className="text-on-surface-variant dark:text-surface-variant font-label-md text-label-md hover:text-primary dark:hover:text-primary-fixed-dim transition-opacity hover:opacity-80" href="#">Campus Security</a>
            <a className="text-on-surface-variant dark:text-surface-variant font-label-md text-label-md hover:text-primary dark:hover:text-primary-fixed-dim transition-opacity hover:opacity-80" href="#">Privacy Policy</a>
            <a className="text-on-surface-variant dark:text-surface-variant font-label-md text-label-md hover:text-primary dark:hover:text-primary-fixed-dim transition-opacity hover:opacity-80" href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </>
  );
}
