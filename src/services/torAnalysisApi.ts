/**
 * Tor Analysis API Service
 * Handles communication with Flask backend for Tor traffic analysis
 */

const API_BASE_URL = import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000';

export interface HealthCheckResponse {
    status: string;
    service: string;
    version: string;
    models: {
        hmm_model: boolean;
        scaler: boolean;
        lstm_model: boolean;
    };
    endpoints: {
        predict_csv: string;
        predict_pcap: string;
        download: string;
    };
}

export interface PredictionResponse {
    predicted_class: string;
    confidence: number;
    features: {
        pkt_rate: number;
        avg_pkt_size: number;
        burstiness: number;
        direction_ratio: number;
        circuit_lifetime: number;
    };
    probabilities: number[];
    map_data: Array<{
        lat: number;
        lon: number;
        region: string;
    }>;
    classes: string[];
    privacy_risk_score: number;
    privacy_risk_level: string;
    privacy_risk_color: string;
    timeline_series?: Array<{
        packet_num: number;
        size: number;
        direction: string;
        inter_time: number;
    }>;
    total_packets?: number;
}

/**
 * Check if Flask backend is healthy and running
 */
export async function checkBackendHealth(): Promise<HealthCheckResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Health check failed: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Backend health check failed:', error);
        throw new Error('Unable to connect to Tor Analysis backend. Please ensure the Flask server is running on port 5000.');
    }
}

/**
 * Upload CSV and TXT files for Tor traffic analysis
 */
export async function predictFromCSV(
    csvFile: File,
    txtFile: File
): Promise<PredictionResponse> {
    try {
        const formData = new FormData();
        formData.append('csv_file', csvFile);
        formData.append('txt_file', txtFile);

        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Prediction failed');
        }

        return await response.json();
    } catch (error) {
        console.error('CSV prediction failed:', error);
        throw error;
    }
}

/**
 * Upload PCAP file for Tor traffic analysis
 */
export async function predictFromPCAP(
    pcapFile: File,
    txtFile?: File
): Promise<PredictionResponse> {
    try {
        const formData = new FormData();
        formData.append('pcap_file', pcapFile);
        if (txtFile) {
            formData.append('txt_file', txtFile);
        }

        const response = await fetch(`${API_BASE_URL}/api/predict_pcap`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'PCAP analysis failed');
        }

        return await response.json();
    } catch (error) {
        console.error('PCAP prediction failed:', error);
        throw error;
    }
}

/**
 * Download analysis results as CSV
 */
export async function downloadResults(data: PredictionResponse): Promise<Blob> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/download_results`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error('Download failed');
        }

        return await response.blob();
    } catch (error) {
        console.error('Download failed:', error);
        throw error;
    }
}
