import { useState } from 'react';
import Platforms from './Platforms';

export default function Hero({ onDownload }) {
	const [url, setUrl] = useState('');

	const handleSubmit = (event) => {
		event.preventDefault();
		const trimmed = url.trim();
		if (!trimmed) return;
		onDownload?.(trimmed);
	};

	return (
		<section className="hero" aria-labelledby="hero-heading">
			<div className="hero-glow" aria-hidden="true" />

			<div className="hero-content">
				<p className="hero-eyebrow">FREE · FAST · NO SIGNUP</p>

				<h1 id="hero-heading" className="hero-headline">
					Download Anything.
					<br />
					From Anywhere.
				</h1>

				<p className="hero-subheadline">
					Paste a link from YouTube, Instagram, TikTok, X, Facebook and more. Get your file in seconds.
				</p>

				<form className="hero-downloader" id="downloader" onSubmit={handleSubmit}>
					<input
						type="text"
						value={url}
						onChange={(event) => setUrl(event.target.value)}
						placeholder="Paste a link to download"
						className="hero-input"
						aria-label="Paste a link to download"
					/>
					<button
						type="submit"
						className="hero-download-button"
						disabled={!url.trim()}
					>
						Download
					</button>
				</form>

				<p className="hero-supported">
					Supports YouTube · Instagram · TikTok · X · Facebook · Pinterest · Vimeo and more
				</p>

			</div>
		</section>
	);
}
