import { useState } from 'react';

/**
 * Hero component that provides a URL downloader UI and triggers server-backed file downloads.
 *
 * Renders an input for a URL, a submit button that shows a loading state while a POST request to
 * http://localhost:5000/api/download is in flight, and an error message area. On successful response
 * the component converts the response into a blob, derives a filename from the `content-disposition`
 * header (fallback `cliprr-download`), and programmatically starts a browser download. On failure it
 * displays a user-facing error message.
 *
 * @returns {JSX.Element} The rendered hero section containing the downloader UI.
 */
export default function Hero() {
	const [url, setUrl] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const handleDownload = async () => {
		const trimmed = url.trim();
		if (!trimmed) return;

		setLoading(true);
		setError('');

		try {
			const response = await fetch('http://localhost:5000/api/download', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: trimmed }),
			});

			if (!response.ok) {
				let message = 'Download failed. Please try again.';
				try {
					const data = await response.json();
					if (data?.error) message = data.error;
				} catch (_) {
					// ignore parse errors
				}
				setError(message);
				return;
			}

			const blob = await response.blob();
			const disposition = response.headers.get('content-disposition') || '';
			let filename = 'cliprr-download';
			const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
			if (match && match[1]) {
				filename = match[1].replace(/['"]/g, '') || filename;
			}

			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = objectUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} catch (err) {
			console.error('Download request failed:', err);
			setError('Download failed. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		handleDownload();
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
						onChange={(event) => {
							setUrl(event.target.value);
							if (error) setError('');
						}}
						placeholder="Paste a link to download"
						className="hero-input"
						aria-label="Paste a link to download"
					/>
					<button
						type="submit"
						className={`hero-download-button${loading ? ' loading' : ''}`}
						disabled={loading || !url.trim()}
					>
						{loading ? (
							<>
								<span className="hero-spinner" aria-hidden="true" />
								Downloading...
							</>
						) : (
							'Download'
						)}
					</button>
				</form>

				{error && <p className="hero-error">{error}</p>}

				<p className="hero-supported">
					Supports YouTube · Instagram · TikTok · X · Facebook · Pinterest · Vimeo and more
				</p>

			</div>
		</section>
	);
}
