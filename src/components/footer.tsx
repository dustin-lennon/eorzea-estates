import { version } from "../../package.json"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-6 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
        <p>&copy; SQUARE ENIX CO., LTD. All Rights Reserved.</p>
        <p>FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.</p>
        <p>Created by Caspian Nightworth of Brynhildr</p>
        <p className="flex items-center gap-3">
          <span>&copy; {year} Eorzea Estates. All Rights Reserved.</span>
          <span>&middot;</span>
          <a
            href="https://ko-fi.com/caspiannightworth"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Support on Ko-fi
          </a>
          <span>&middot;</span>
          <span>v{version}</span>
        </p>
      </div>
    </footer>
  )
}
