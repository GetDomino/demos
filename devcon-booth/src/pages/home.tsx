import { useExperience } from "@domino-sdk/relay/react"
import { Booth } from "../components/booth"
import { Notice } from "../components/notice"
import { SignIn } from "../components/sign-in"
import { hero } from "../content"

export function HomePage() {
  const experience = useExperience()

  if (experience.status === "signed-out") {
    return (
      <div className="space-y-8">
        <section className="space-y-4">
          <h1 className="headline text-[56px]">{hero.signedOut}</h1>
          <p className="text-lg leading-snug font-medium">
            {hero.signedOutBody}
          </p>
        </section>
        <SignIn />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="headline text-[34px]">{hero.signedIn}</h1>
      {experience.status === "loading" && (
        <p aria-busy="true" className="font-medium">
          Loading…
        </p>
      )}
      {experience.status === "error" && (
        <Notice tone="alert">
          Couldn't reach Domino: {experience.error.message} Retrying…
        </Notice>
      )}
      {experience.status === "ready" && (
        <>
          {experience.error && (
            <Notice>
              Having trouble refreshing. Showing your last known progress.
            </Notice>
          )}
          <Booth quests={experience.data.quests} />
        </>
      )}
    </div>
  )
}
