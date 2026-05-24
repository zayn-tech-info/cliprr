import { useMemo, useState } from 'react';

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
const formatCount = (value) => {
	if (!Number.isFinite(value)) return null;
	return new Intl.NumberFormat().format(value);
};

const formatDuration = (seconds) => {
	if (!Number.isFinite(seconds)) return null;
	const total = Math.max(0, Math.floor(seconds));
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = total % 60;
	if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	return `${m}:${String(s).padStart(2, '0')}`;
};

const makeJobId = () => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	return `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function Hero() {
	const [url, setUrl] = useState('');
	const [error, setError] = useState('');
	const [analyzing, setAnalyzing] = useState(false);
	const [downloading, setDownloading] = useState(false);
	const [media, setMedia] = useState(null);
	const [selectedFormatId, setSelectedFormatId] = useState('');
	const [activeJobId, setActiveJobId] = useState('');
	const [activeController, setActiveController] = useState(null);
	const [qualityMenuOpen, setQualityMenuOpen] = useState(false);

	const apiBase = useMemo(
		() => (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
		[]
	);
	const infoEndpoint = apiBase ? `${apiBase}/api/download/info` : '/api/download/info';
	const downloadEndpoint = apiBase ? `${apiBase}/api/download` : '/api/download';
	const cancelEndpoint = apiBase ? `${apiBase}/api/download/cancel` : '/api/download/cancel';
	const selectedFormat = (media?.formats || []).find((item) => item.formatId === selectedFormatId) || null;

	const resetAnalysis = () => {
		setMedia(null);
		setSelectedFormatId('');
		setActiveJobId('');
		setQualityMenuOpen(false);
	};

	const parseError = async (response, fallback) => {
		let message = fallback;
		try {
			const data = await response.json();
			if (data?.error) message = data.error;
		} catch (_) {
			// ignore parse errors
		}
		return message;
	};

	const cancelProcess = async () => {
		activeController?.abort();
		if (activeJobId) {
			try {
				await fetch(cancelEndpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ jobId: activeJobId }),
				});
			} catch (_) {
				// ignore cancel errors
			}
		}
		setAnalyzing(false);
		setDownloading(false);
		setActiveController(null);
		setActiveJobId('');
	};

	const handleAnalyze = async () => {
		const trimmed = url.trim();
		if (!trimmed) return;

		setError('');
		setAnalyzing(true);
		resetAnalysis();

		const controller = new AbortController();
		setActiveController(controller);

		try {
			const response = await fetch(infoEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: trimmed }),
				signal: controller.signal,
			});

			if (!response.ok) {
				setError(await parseError(response, 'Unable to load media details.'));
				return;
			}

			const data = await response.json();
			setMedia(data);
			setSelectedFormatId(data?.defaultFormatId || data?.formats?.[0]?.formatId || '');
			setQualityMenuOpen(false);
		} catch (err) {
			if (!(err instanceof DOMException && err.name === 'AbortError')) {
				setError('Unable to load media details.');
			}
		} finally {
			setAnalyzing(false);
			setActiveController(null);
		}
	};

	const handleStartDownload = async () => {
		if (!media?.sourceUrl) return;
		setError('');
		setDownloading(true);

		const controller = new AbortController();
		setActiveController(controller);
		const jobId = makeJobId();
		setActiveJobId(jobId);

		try {
			const response = await fetch(downloadEndpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: media.sourceUrl,
					formatId: selectedFormatId || undefined,
					jobId,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				setError(await parseError(response, 'Download failed. Please try again.'));
				return;
			}

			const disposition = response.headers.get('content-disposition') || '';
			let filename = 'cliprr-download';
			const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
			if (match && match[1]) {
				filename = match[1].replace(/['"]/g, '') || filename;
			}

			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = objectUrl;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} catch (err) {
			if (!(err instanceof DOMException && err.name === 'AbortError')) {
				setError('Download failed. Please try again.');
			}
		} finally {
			setDownloading(false);
			setActiveController(null);
			setActiveJobId('');
		}
	};

	const handleSubmit = (event) => {
		event.preventDefault();
		handleAnalyze();
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
						className={`hero-download-button${analyzing ? ' loading' : ''}`}
						disabled={analyzing || downloading || !url.trim()}
					>
						{analyzing ? (
							<>
								<span className="hero-spinner" aria-hidden="true" />
								Analyzing...
							</>
						) : (
							'Load Details'
						)}
					</button>
					{(analyzing || downloading) && (
						<button type="button" className="hero-inline-cancel-button" onClick={cancelProcess}>
							Cancel
						</button>
					)}
				</form>

				{error && <p className="hero-error">{error}</p>}

				{media && (
					<div className="hero-preview-card" aria-live="polite">
						<div className="hero-preview-media">
							{media.thumbnail ? (
								<img src={media.thumbnail} alt={media.title || 'Media preview'} />
							) : (
								<div className="hero-preview-placeholder">No preview available</div>
							)}
						</div>

						<div className="hero-preview-body">
							<div className="hero-preview-head">
								<h3 className="hero-preview-title">{media.title || 'Untitled video'}</h3>
								{formatDuration(media.duration) && (
									<span className="hero-duration-badge">{formatDuration(media.duration)}</span>
								)}
							</div>
							{media.caption && <p className="hero-preview-caption">{media.caption}</p>}

							<div className="hero-preview-author">
								{media.authorAvatar ? (
									<img src={media.authorAvatar} alt={media.authorName || 'Author avatar'} />
								) : (
									<div className="hero-avatar-fallback" aria-hidden="true" />
								)}
								<div>
									<p className="hero-author-name">{media.authorName || 'Unknown author'}</p>
									<div className="hero-preview-stats">
										{formatCount(media.likes) && <span className="hero-stat-pill">{formatCount(media.likes)} likes</span>}
										{formatCount(media.comments) && <span className="hero-stat-pill">{formatCount(media.comments)} comments</span>}
										{formatCount(media.views) && <span className="hero-stat-pill">{formatCount(media.views)} views</span>}
									</div>
								</div>
							</div>

							<div className="hero-quality-panel">
								<p className="hero-quality-label">
									Quality and estimated size
								</p>
								<div className="hero-quality-dropdown">
									<button
										type="button"
										className={`hero-quality-trigger${qualityMenuOpen ? ' open' : ''}`}
										onClick={() => setQualityMenuOpen((prev) => !prev)}
										disabled={downloading}
										aria-expanded={qualityMenuOpen}
										aria-haspopup="listbox"
									>
										<div className="hero-quality-trigger-copy">
											<span className="hero-quality-main">
												{selectedFormat?.qualityLabel || 'Select quality'}
											</span>
											<span className="hero-quality-meta">
												{selectedFormat
													? `${(selectedFormat.ext || '').toUpperCase()}${selectedFormat.sizeLabel ? ` • ${selectedFormat.sizeLabel}` : ''}`
													: 'Pick a quality option'}
											</span>
										</div>
										<span className="hero-quality-caret" aria-hidden="true">
											▾
										</span>
									</button>

									{qualityMenuOpen && (
										<div className="hero-quality-list" role="listbox" aria-label="Quality options">
											{(media.formats || []).map((format) => {
												const active = format.formatId === selectedFormatId;
												return (
													<button
														type="button"
														key={format.formatId}
														className={`hero-quality-option${active ? ' active' : ''}`}
														onClick={() => {
															setSelectedFormatId(format.formatId);
															setQualityMenuOpen(false);
														}}
														disabled={downloading}
														role="option"
														aria-selected={active}
													>
														<span className="hero-quality-main">{format.qualityLabel || format.fullLabel}</span>
														<span className="hero-quality-meta">
															{(format.ext || '').toUpperCase()}
															{format.sizeLabel ? ` • ${format.sizeLabel}` : ''}
														</span>
													</button>
												);
											})}
										</div>
									)}
								</div>
								{selectedFormat && <p className="hero-selected-quality">Selected: {selectedFormat.fullLabel}</p>}
							</div>

							<div className="hero-preview-actions">
								<button
									type="button"
									className={`hero-download-button${downloading ? ' loading' : ''}`}
									onClick={handleStartDownload}
									disabled={downloading || analyzing || !selectedFormatId}
								>
									{downloading ? (
										<>
											<span className="hero-spinner" aria-hidden="true" />
											Downloading...
										</>
									) : (
										'Download Selected Quality'
									)}
								</button>
								<button
									type="button"
									className="hero-secondary-button"
									onClick={resetAnalysis}
									disabled={downloading || analyzing}
								>
									Clear
								</button>
							</div>
						</div>
					</div>
				)}

				<p className="hero-supported">
					Supports YouTube · Instagram · TikTok · X · Facebook · Pinterest · Vimeo and more
				</p>

			</div>
		</section>
	);
}
