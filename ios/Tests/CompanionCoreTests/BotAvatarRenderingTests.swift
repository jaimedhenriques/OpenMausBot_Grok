import XCTest

@testable import CompanionCore

/// The avatar's two-way decision, and the crop a generated picture lands on.
///
/// `BotAvatarView` is a `Canvas` and a `.task`, neither of which a unit test
/// can assert on — so the decision it makes lives here instead, the way the
/// desktop's `resolveBotAvatarOutcome` does (`src/components/Avatar.test.ts`).
/// The rule under test is the spec's: a missing, stale or undecodable
/// attachment falls back to the gradient mascot, never to an empty body.
final class BotAvatarRenderingTests: XCTestCase {
    private func outcome(
        _ crop: AvatarCrop, hasUrl: Bool = true, decoded: Bool = true, failed: Bool = false
    ) -> BotAvatarOutcome {
        resolveBotAvatarOutcome(
            crop: crop, hasUrl: hasUrl, imageDecoded: decoded, failed: failed)
    }

    func testMascotAlwaysDrawsTheGradientBody() {
        XCTAssertEqual(outcome(.mascot), .gradientMascot)
        XCTAssertEqual(outcome(.mascot, hasUrl: false), .gradientMascot)
    }

    func testFlatCropsWearTheImageItself() {
        for crop in [AvatarCrop.circle, .rounded, .square] {
            XCTAssertEqual(outcome(crop), .flatImage, "\(crop) should crop the image")
        }
    }

    func testBlobatarCropAlwaysResolvesToBlobatar() {
        XCTAssertEqual(outcome(.blobatar), .blobatar)
        XCTAssertEqual(outcome(.blobatar, hasUrl: false), .blobatar)
    }

    /// Soft Taste: missing / in-flight / failed flat crops fall back to
    /// blobatar (desktop draws Blobatar; iOS view maps that to the mascot
    /// stand-in until a native renderer ships). The explicit mascot crop
    /// still keeps the gradient body.
    func testFlatCropsFallBackToBlobatarWithoutAPicture() {
        for crop in [AvatarCrop.circle, .rounded, .square] {
            XCTAssertEqual(outcome(crop, hasUrl: false), .blobatar, "\(crop) with no url")
            XCTAssertEqual(outcome(crop, decoded: false), .blobatar, "\(crop) still loading")
            XCTAssertEqual(
                outcome(crop, decoded: false, failed: true), .blobatar, "\(crop) failed")
        }
        XCTAssertEqual(outcome(.mascot, hasUrl: false), .gradientMascot)
    }

    /// A decode that succeeded and then a failure flag: Soft Taste blobatar.
    func testAFailedFetchNeverDrawsTheImage() {
        XCTAssertEqual(outcome(.rounded, failed: true), .blobatar)
        XCTAssertEqual(outcome(.circle, failed: true), .blobatar)
    }

    // MARK: - The crop a generated picture lands on

    /// A mascot bot that generates a new avatar takes the server's `circle`
    /// — a generated image is its own portrait, and `mascot` would mean "no
    /// picture" and throw away what was just generated.
    func testGeneratingFromAMascotBotTakesTheServersCrop() {
        XCTAssertEqual(
            AvatarCrop.afterGenerating(cropAtStart: .mascot, latestCrop: .mascot, serverCrop: .circle),
            .circle)
    }

    /// If the user moves the picker while the request is still in flight,
    /// that newer explicit choice wins outright — the server's pick, whatever
    /// it was, is discarded.
    func testMovingThePickerMidFlightWinsOverTheServersPick() {
        XCTAssertEqual(
            AvatarCrop.afterGenerating(cropAtStart: .mascot, latestCrop: .square, serverCrop: .circle),
            .square)
        XCTAssertEqual(
            AvatarCrop.afterGenerating(cropAtStart: .circle, latestCrop: .rounded, serverCrop: .square),
            .rounded)
    }

    /// No server crop at all is unreachable in practice, but the fallback is
    /// aligned with the desktop's own unreachable fallback (`?? "circle"` in
    /// `BotProfileAvatarCard.tsx`): `.circle`, what the server actually
    /// assigns a mascot bot.
    func testNoServerCropFallsBackToCircle() {
        XCTAssertEqual(
            AvatarCrop.afterGenerating(cropAtStart: .mascot, latestCrop: .mascot, serverCrop: nil),
            .circle)
    }
}
