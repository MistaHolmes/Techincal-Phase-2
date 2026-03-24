import { UserButton } from "@clerk/clerk-react";
import Header3 from "../components/ui/header3";
import UserContentSection from "../components/UserContent";

const ProfileComponent = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-slate-950 transition-colors duration-300">
      {/* Full-width Header */}
      <div className="w-full">
        <Header3 />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Account Management Box */}
        <div className="bg-white dark:bg-gray-900/60 rounded-xl shadow-md border border-gray-300 dark:border-gray-800 p-6 flex flex-col md:flex-row items-center justify-between transition-colors">
            {/* Info Section */}
            <div className="md:w-3/4">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Manage Your Account</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Access and update your personal details, security settings, and view your recent activity. Use the profile menu to manage your account efficiently.
            </p>
            </div>
            {/* User Button Section */}
            <div className="md:w-1/4 flex justify-center md:justify-end mt-6 md:mt-0 mr-4">
            <UserButton
                afterSignOutUrl="/"
                appearance={{
                elements: {
                    userButtonAvatarBox: "w-12 h-12",
                },
            }}/>
        </div>
        </div>
        {/* Manage Your Blogs Section */}
        <UserContentSection/>
      </div>
    </div>
  );
};

export default ProfileComponent;
