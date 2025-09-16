import { NextResponse } from "next/server"

export async function POST(request: Request) {
  console.log("Search API route called")

  try {
    // Parse the request body
    let query = ""
    let filters = undefined
    let indexName = undefined
    try {
      const body = await request.json()
      query = body.query || ""
      filters = body.filters
      indexName = body.indexName
    } catch (error) {
      console.error("Error parsing request body:", error)
      return NextResponse.json(
        {
          error: "Invalid request body",
          hits: [],
          nbHits: 0,
          page: 0,
          nbPages: 0,
          hitsPerPage: 0,
          processingTimeMS: 0,
          query: "",
        },
        { status: 400 },
      )
    }

    console.log(`Received search query: "${query}"${filters ? ` with filters: ${filters}` : ""}`)

    if (!query || typeof query !== "string") {
      console.error("Invalid query parameter:", query)
      return NextResponse.json(
        {
          error: "Query parameter is required and must be a string",
          hits: [],
          nbHits: 0,
          page: 0,
          nbPages: 0,
          hitsPerPage: 0,
          processingTimeMS: 0,
          query: "",
        },
        { status: 400 },
      )
    }

    // Check if environment variables are available
    let appId: string | undefined
    let apiKey: string | undefined
    let finalIndexName: string | undefined

    if (indexName === 'service_assignments') {
      appId = process.env.NEXT_PUBLIC_ALGOLIA_ASSIGNMENTS_APP_ID
      apiKey = process.env.ALGOLIA_ASSIGNMENTS_ADMIN_API_KEY
      finalIndexName = process.env.NEXT_PUBLIC_ALGOLIA_ASSIGNMENTS_INDEX_NAME
    } else {
      appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID
      apiKey = process.env.ALGOLIA_ADMIN_API_KEY
      finalIndexName = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME
    }

    if (!appId || !apiKey || !finalIndexName) {
      console.error("Missing Algolia environment variables")
      return NextResponse.json(
        {
          error: "Algolia configuration is incomplete. Please check your environment variables.",
          hits: [],
          nbHits: 0,
          page: 0,
          nbPages: 0,
          hitsPerPage: 0,
          processingTimeMS: 0,
          query,
        },
        { status: 500 },
      )
    }

    // Use the Algolia REST API directly instead of the JS client
    // This avoids issues with importing the client in Next.js server components
    const url = `https://${appId}-dsn.algolia.net/1/indexes/${finalIndexName}/query`
    const headers = {
      "X-Algolia-API-Key": apiKey,
      "X-Algolia-Application-Id": appId,
      "Content-Type": "application/json",
    }

    // Prepare search parameters
    let attributesToRetrieve = "name,type,location,price,site_code,image_url,category,seller_id"
    let attributesToHighlight = "name,location"

    if (indexName === 'service_assignments') {
      attributesToRetrieve = "saNumber,projectSiteId,projectSiteName,projectSiteLocation,serviceType,assignedTo,jobDescription,message,joNumber,requestedBy,status,coveredDateStart,coveredDateEnd,created,updated,company_id"
      attributesToHighlight = "saNumber,projectSiteName,serviceType"
    }

    const searchParams: any = {
      query,
      hitsPerPage: "50", // More for assignments
      attributesToRetrieve,
      attributesToHighlight,
    }

    // Add filters if provided
    if (filters) {
      searchParams["filters"] = filters
    }

    const body = JSON.stringify({
      params: new URLSearchParams(searchParams).toString(),
    })

    console.log(`Calling Algolia REST API: ${url}`)
    console.log(`Search parameters: ${JSON.stringify(searchParams)}`)

    const algoliaResponse = await fetch(url, {
      method: "POST",
      headers,
      body,
    })

    if (!algoliaResponse.ok) {
      const errorText = await algoliaResponse.text()
      console.error(`Algolia API error (${algoliaResponse.status}):`, errorText)
      return NextResponse.json(
        {
          error: `Algolia API returned status ${algoliaResponse.status}`,
          details: errorText,
          hits: [],
          nbHits: 0,
          page: 0,
          nbPages: 0,
          hitsPerPage: 0,
          processingTimeMS: 0,
          query,
        },
        { status: algoliaResponse.status },
      )
    }

    const searchResults = await algoliaResponse.json()
    console.log(`Search completed with ${searchResults.nbHits} results`)

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error("Search API error:", error)

    // Always return a valid JSON response
    return NextResponse.json(
      {
        error: "An error occurred while searching. Please try again later.",
        details: error instanceof Error ? error.message : "Unknown error",
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 0,
        processingTimeMS: 0,
        query: "",
      },
      { status: 500 },
    )
  }
}
