# Asynchronous Feedback Processing Service

## Overview

This project is an asynchronous feedback processing tool built as a web-based application to support learner coaching workflows. It allows coaching notes or session inputs to be submitted through a web interface and processed in the background to generate structured, actionable feedback for learners.

The primary goal of the system is to improve the quality and consistency of feedback while keeping live coaching sessions focused and lightweight. From a technical perspective, this project was built to explore backend systems, microservices, and asynchronous job processing using AWS.

## Why This Project Exists

In my coaching work, I found that a lot of valuable feedback emerged during conversations but was difficult to consistently capture, structure, and deliver afterward. I wanted to build a tool that could help turn those raw notes into clear, constructive feedback without adding overhead during sessions.

This project allowed me to solve a real problem I was experiencing while intentionally exploring backend architecture, systems thinking, and failure handling in a production-style setup.

## High Level Architecture

The system is built around asynchronous message processing using Amazon SQS and Amazon S3.

1. A user submits coaching notes through a web-based application.
2. The backend API validates the request and stores the raw session data in Amazon S3.
3. The API publishes a message to an Amazon SQS queue containing references to the stored data.
4. Worker services consume messages from the queue.
5. Workers retrieve the session data from Amazon S3, process it, and generate structured feedback outputs.
6. The system handles retries, failures, and message visibility to ensure reliable processing.

This architecture allows the system to scale independently and remain resilient when processing takes longer or fails.

## Key Features

- Web-based submission of coaching notes
- Asynchronous job processing using Amazon SQS
- Amazon S3 for durable storage of session data
- Stateless worker services
- Retry logic and failure handling
- Separation of concerns between API and workers
- Structured logging for observability
- Designed with scalability and reliability in mind

## Technical Stack

- Node.js with TypeScript
- Amazon SQS for message queuing
- Amazon S3 for object storage
- AWS services for infrastructure
- RESTful API design
- Basic test coverage for core logic

## Challenges and Learnings

One of the main challenges was learning how to design for failure rather than assuming synchronous execution. Early iterations exposed issues around retries, duplicate processing, and long-running tasks. Addressing these problems required understanding concepts like visibility timeouts, idempotency, and dead letter queues.

This project significantly strengthened my understanding of backend reliability, distributed systems, and defensive system design.

## Using AI Tools

AI coding assistants were used as a support tool to accelerate development and explore patterns, but all generated suggestions were reviewed, tested, and validated against official documentation and observed system behavior. This helped reinforce independent reasoning and system understanding.

## What to Look At

If you are reviewing this project, useful places to start include:

- The API service responsible for request validation, S3 uploads, and message publishing
- The worker service that consumes SQS messages and processes stored data
- Retry and error handling logic
- Logging and observability decisions


