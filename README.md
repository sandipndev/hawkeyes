# HawkEyes

HawkEyes is real-time intelligence for physical spaces. It turns ordinary CCTV networks into a single, coherent system that understands movement, behavior, and intent across an entire facility.

Instead of isolated video feeds watched by tired human eyes, HawkEyes builds a living 3D view of a site and continuously reasons over what’s happening inside it. It doesn’t just monitor. It correlates, learns, and flags risks early — when prevention is still possible!


## How we built it ⚙️
The web application is built with Next.js focusing on clarity and speed under pressure.

At the core is a streaming-first architecture. Confluent Cloud acts as the backbone, ingesting raw video frames and structured metadata at scale. Apache Flink processes streams with sub-second latency, enriching frames with spatial and temporal context.

![image](https://i.postimg.cc/TPwHX8TK/image.png)

On the intelligence side, Google Cloud Vertex AI powers detection and behavior analysis. Vision models handle object detection on every frame, while Gemini (used as a judge model in the loop) helps classify risk levels and anomalies. Structured outputs are stored in BigQuery for fast analytics and Google Cloud Storage for long-term history.


## Installation

1. Clone the repository including submodules:
   ```bash
   git clone --recursive <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd HawkEyes/hawkeyes
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Set up the infrastructure using Docker:
   ```bash
   docker-compose up -d
   ```
5. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

## Running the Application

1. Start the development server for the frontend:
   ```bash
   pnpm dev
   ```
2. In a separate terminal, start the backend service:
   ```bash
   cd backend
   pnpm dev
   ```
3. Access the application at http://localhost:3000.


## License
Licensed under the Apache License 2.0.
