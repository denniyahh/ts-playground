import Head from "next/head";
import { ChangeEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SettingsModal from "@/components/ui/SettingsModal";

const DEFAULT_CHUNK_SIZE = 3000;
const DEFAULT_CHUNK_OVERLAP = 20;
const DEFAULT_TOP_K = 2;
const DEFAULT_TEMPERATURE = 0.1;
const DEFAULT_TOP_P = 1;

export default function Home() {
  const answerId = useId();
  const queryId = useId();
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [needsNewIndex, setNeedsNewIndex] = useState(true);
  const [buildingIndex, setBuildingIndex] = useState(false);
  const [runningQuery, setRunningQuery] = useState(false);
  const [nodesWithEmbedding, setNodesWithEmbedding] = useState([]);
  const [chunkSize, setChunkSize] = useState(DEFAULT_CHUNK_SIZE.toString());
  //^ We're making all of these strings to preserve things like the user typing "0."
  const [chunkOverlap, setChunkOverlap] = useState(
    DEFAULT_CHUNK_OVERLAP.toString(),
  );
  const [topK, setTopK] = useState(DEFAULT_TOP_K.toString());
  const [temperature, setTemperature] = useState(
    DEFAULT_TEMPERATURE.toString(),
  );
  const [topP, setTopP] = useState(DEFAULT_TOP_P.toString());
  const [answer, setAnswer] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mainCharacters, setMainCharacters] = useState<any[]>([]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target?.result as string;
        setText(fileContent);
        setNeedsNewIndex(true);

        // Automatically build index and run query after file upload
        setAnswer("Building index...");
        setBuildingIndex(true);
        setNeedsNewIndex(false);

        const result = await fetch("/api/splitandembed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            document: fileContent,
            chunkSize: parseInt(chunkSize),
            chunkOverlap: parseInt(chunkOverlap),
          }),
        });

        const { error, payload } = await result.json();

        if (error) {
          setAnswer(error);
        }

        if (payload) {
          setNodesWithEmbedding(payload.nodesWithEmbedding);
          setAnswer("Index built!");

          // Automatically run query to extract main characters
          setAnswer("Extracting main characters...");
          setRunningQuery(true);

          const queryResult = await fetch("/api/retrieveandquery", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: "Extract only the top main characters with their Name, Description, and Personality",
              nodesWithEmbedding: payload.nodesWithEmbedding,
              topK: DEFAULT_TOP_K,
              temperature: DEFAULT_TEMPERATURE,
              topP: DEFAULT_TOP_P,
            }),
          });

          const { error: queryError, payload: queryPayload } = await queryResult.json();

          if (queryError) {
            setAnswer(queryError);
          }

          if (queryPayload) {
            if (Array.isArray(queryPayload.response)) {
              setMainCharacters(queryPayload.response);
            } else {
              console.error("Expected an array for main characters");
              setMainCharacters([]);
            }
            setAnswer("");
          }

          setRunningQuery(false);
        }

        setBuildingIndex(false);
      };
      if (file.type != "text/plain") {
        console.error(`${file.type} parsing not implemented`);
        setText("Error");
      } else {
        reader.readAsText(file);
      }
    }
  };

  return (
    <>
      <Head>
        <title>LlamaIndex.TS Playground</title>
      </Head>
      <main className="mx-2 flex h-full flex-col lg:mx-56 bg-white text-black">
        <div className="flex justify-between">
          <div>
            <input
              type="file"
              accept=".txt"
              id="file-upload"
              style={{ display: "none" }}
              onChange={handleFileUpload}
            />
            <Button onClick={() => document.getElementById('file-upload')?.click()}>
              Upload Source Text
            </Button>
          </div>
          <Button onClick={() => setIsSettingsOpen(true)}>Settings</Button>
        </div>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          chunkSize={chunkSize}
          setChunkSize={setChunkSize}
          chunkOverlap={chunkOverlap}
          setChunkOverlap={setChunkOverlap}
        />
        <Button
          disabled={!needsNewIndex || buildingIndex || runningQuery}
          onClick={async () => {
            setAnswer("Building index...");
            setBuildingIndex(true);
            setNeedsNewIndex(false);
            // Post the text and settings to the server
            const result = await fetch("/api/splitandembed", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                document: text,
                chunkSize: parseInt(chunkSize),
                chunkOverlap: parseInt(chunkOverlap),
              }),
            });
            const { error, payload } = await result.json();

            if (error) {
              setAnswer(error);
            }

            if (payload) {
              setNodesWithEmbedding(payload.nodesWithEmbedding);
              setAnswer("Index built!");
            }

            setBuildingIndex(false);
          }}
        >
          {buildingIndex ? "Building Vector index..." : "Build index"}
        </Button>

        {!buildingIndex && !needsNewIndex && !runningQuery && (
          <>
            <div className="my-2 flex h-1/4 flex-auto flex-col space-y-2">
              <Label htmlFor={answerId}>Main Characters:</Label>
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personality</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mainCharacters.map((character, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{character.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{character.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{character.personality}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
