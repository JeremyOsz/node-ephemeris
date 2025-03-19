import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { calculateBirthChart } from './chart';
import { BirthData } from './types';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }
    
    const birthData: BirthData = JSON.parse(event.body);
    
    // Validate input
    if (!birthData.date || !birthData.time || 
        birthData.latitude === undefined || birthData.longitude === undefined || 
        birthData.timezone === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required birth data fields' })
      };
    }
    
    // Calculate birth chart
    const birthChart = calculateBirthChart(birthData);
    
    return {
      statusCode: 200,
      body: JSON.stringify(birthChart)
    };
  } catch (error) {
    console.error('Error calculating birth chart:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to calculate birth chart' })
    };
  }
}