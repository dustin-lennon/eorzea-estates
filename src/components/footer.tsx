export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background mt-auto">
      <div className="container mx-auto px-4 py-6 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
        <p>
          FINAL FANTASY XIV &copy; 2010 &ndash; 2021 SQUARE ENIX CO., LTD. All Rights Reserved.
          FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.
        </p>
        <p>Created by Caspian Nightworth of Brynhildr</p>
        <p>
          &copy; {year} Eorzea Estates. All Rights Reserved. &middot;{" "}
          <a
            href="https://ko-fi.com/caspiannightworth"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Support on Ko-fi
          </a>
        </p>
      </div>
    </footer>
  )
}
