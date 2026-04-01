import { useState } from 'react';

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
			const base = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');
			const endpoint = `${base}/api/download`;

			const response = await fetch(base ? endpoint : '/api/download', {
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

			const disposition = response.headers.get('content-disposition') || '';
			let filename = 'cliprr-download';
			const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
			if (match && match[1]) {
				filename = match[1].replace(/['"]/g, '') || filename;
			}

			if (!response.body) {
				throw new Error('No response body to stream.');
			}

			if (typeof window.showSaveFilePicker === 'function') {
				const handle = await window.showSaveFilePicker({ suggestedName: filename });
				const writable = await handle.createWritable();
				await response.body.pipeTo(writable);
			} else {
				const blob = await response.blob();
				const objectUrl = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = objectUrl;
				link.download = filename;
				document.body.appendChild(link);
				link.click();
				link.remove();
				URL.revokeObjectURL(objectUrl);
			}
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				console.info('Download cancelled by user');
			} else {
				console.error('Download request failed:', err);
				setError('Download failed. Please try again.');
			}
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
