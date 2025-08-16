<header class="bg-gray-800 text-white p-4 flex justify-between items-center shadow-lg sticky top-0 z-10">
    <h2 class="text-3xl font-bold text-yellow-400">Book Chapters</h2>
    <div class="flex items-center space-x-4">
        <button id="about-button" onclick="loadChapter('header/À%20propos.html')" class="flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200">
            <span>À propos</span>
        </button>
		
		
		<button id="about-button" onclick="loadChapter('header/contact.html')" class="flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200">
            <span>Contacter</span>
        </button>
        
        <button onclick="toggleNightMode()" class="flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon-star mr-2">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 0 1-9-9Z"></path>
                <path d="M19 3v4"></path>
                <path d="M21 5h-4"></path>
                <path d="M12 17v4"></path>
                <path d="M14 19h-4"></path>
            </svg>
            <span>Night Mode</span>
        </button>
    </div>
</header>
