import Hero from './components/Hero';
import Navbar from './components/Navbar';
import Home from './pages/Home';

export default function App() {
	const handleDownload = (url) => {
		// Wire download logic later; for now keep the call flowing
		console.log('Download requested for:', url);
	};

	return (
		<div className="page-shell">
			<Navbar />
			<main className="page-content hero-page">
				<Home onDownload={handleDownload} />
			</main>
		</div>
	);
}