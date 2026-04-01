import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		const handleEsc = (event) => {
			if (event.key === 'Escape') setIsOpen(false);
		};
		if (isOpen) document.addEventListener('keydown', handleEsc);
		return () => document.removeEventListener('keydown', handleEsc);
	}, [isOpen]);

	const closeDrawer = () => setIsOpen(false);

	return (
		<nav className="navbar">
			<div className="navbar-inner">
				<Link to="/" className="logo" aria-label="Cliprr home">
					<span className="logo-main">Clip</span>
					<span className="logo-highlight">rr</span>
				</Link>

				<div className="nav-actions">
					<div className="nav-links">
						<Link className="nav-link" to="/about">
							About
						</Link>
						<Link className="nav-link" to="/faq">
							FAQ
						</Link>
					</div>

					<Link className="cta-button" to="/#downloader">
						Get Started
					</Link>

					<button
						type="button"
						className="menu-button"
						aria-label="Open navigation menu"
						onClick={() => setIsOpen(true)}
					>
						<Menu size={24} />
					</button>
				</div>
			</div>

			{isOpen && (
				<div className="drawer-overlay" onClick={closeDrawer}>
					<div
						className="drawer"
						role="dialog"
						aria-modal="true"
						onClick={(event) => event.stopPropagation()}
					>
						<button
							type="button"
							className="drawer-close"
							aria-label="Close navigation menu"
							onClick={closeDrawer}
						>
							<X size={24} />
						</button>

						<div className="drawer-links">
							<Link className="nav-link" to="/about" onClick={closeDrawer}>
								About
							</Link>
							<Link className="nav-link" to="/faq" onClick={closeDrawer}>
								FAQ
							</Link>
							<Link className="cta-button" to="/#downloader" onClick={closeDrawer}>
								Get Started
							</Link>
						</div>
					</div>
				</div>
			)}
		</nav>
	);
}
