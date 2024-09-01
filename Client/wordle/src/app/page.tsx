import Image from "next/image";
import WordleGame from "@/components/WordleGame";

export default function Home() {
  return (
    <main>
      <h1>Wordle in Next.js</h1>
      <WordleGame />
    </main>
  );
}