# Intelligent Qur'an Memorization System - Algorithms and Formulas

This document details the specific algorithms and formulas that power the Intelligent Qur'an Memorization System.

## 1. User Profile Initialization Algorithm

```
function initializeUserProfile(userId):
    # Check if user profile exists
    profile = baserow.query("UserProfiles", {"userId": userId})
    
    if profile is empty:
        # Create default profile
        defaultProfile = {
            "userId": userId,
            "creationDate": currentDate(),
            "personalGoals": {
                "weeklyPages": 2.5,
                "preferredDays": ["Friday", "Saturday", "Sunday"],
                "targetCompletionDate": null
            },
            "academicCommitments": [],
            "memorizationMethod": "NRLT + Spaced Repetition",
            "currentProgress": {
                "chaptersMemorized": [],
                "currentPosition": {
                    "surah": 1,
                    "ayah": 1,
                    "page": 1,
                    "juz": 1
                }
            },
            "weakAyahs": [],
            "notificationPreferences": {
                "channels": ["GoogleCalendar"],
                "reminderTimes": [15]  # minutes before event
            }
        }
        
        baserow.insert("UserProfiles", defaultProfile)
        return defaultProfile
    else:
        return profile
```

## 2. Scheduling Algorithm (NRLT + Spaced Repetition)

### 2.1 New Memorization Scheduling

```
function scheduleNewMemorization(userProfile, currentDate):
    # Get user's weekly goal and preferred days
    weeklyPages = userProfile.personalGoals.weeklyPages
    preferredDays = userProfile.personalGoals.preferredDays
    
    # Calculate pages per preferred day
    pagesPerDay = weeklyPages / preferredDays.length
    
    # Find next preferred day from current date
    nextPreferredDay = findNextOccurrence(preferredDays, currentDate)
    
    # Create new memorization event
    newMemEvent = {
        "userId": userProfile.userId,
        "eventType": "NewMemorization",
        "date": nextPreferredDay,
        "duration": calculateDuration(pagesPerDay),  # Formula below
        "content": {
            "surah": userProfile.currentProgress.currentPosition.surah,
            "startAyah": userProfile.currentProgress.currentPosition.ayah,
            "pages": pagesPerDay,
            "endPosition": estimateEndPosition(userProfile.currentProgress.currentPosition, pagesPerDay)
        }
    }
    
    return newMemEvent
```

### 2.2 Duration Calculation Formula

```
function calculateDuration(pages):
    # Average time per page (in minutes) based on complexity
    baseTimePerPage = 20
    
    # Calculate total duration in minutes
    durationMinutes = pages * baseTimePerPage
    
    # Round up to nearest 5 minutes
    return ceil(durationMinutes / 5) * 5
```

### 2.3 Recent Review Scheduling

```
function scheduleRecentReviews(userProfile, currentDate):
    # Define review intervals (in days)
    reviewIntervals = [1, 2, 7]
    
    recentReviews = []
    
    # Get recently memorized content (last 7 days)
    recentContent = baserow.query("MemorizationProgress", {
        "userId": userProfile.userId,
        "completionDate": {"$gte": currentDate - 7 days}
    })
    
    # Group by completion date
    groupedContent = groupByCompletionDate(recentContent)
    
    # Schedule reviews for each group
    for date, content in groupedContent:
        for interval in reviewIntervals:
            reviewDate = date + interval days
            
            # Skip if review date is in the past
            if reviewDate < currentDate:
                continue
                
            reviewEvent = {
                "userId": userProfile.userId,
                "eventType": "RecentReview",
                "date": reviewDate,
                "duration": calculateReviewDuration(content),  # Formula below
                "content": {
                    "originalMemorizationDate": date,
                    "sections": content
                }
            }
            
            recentReviews.push(reviewEvent)
    
    return recentReviews
```

### 2.4 Review Duration Formula

```
function calculateReviewDuration(content):
    # Base time per ayah (in seconds)
    baseTimePerAyah = 30
    
    # Count total ayahs in content
    totalAyahs = countAyahs(content)
    
    # Calculate total duration in minutes
    durationMinutes = (totalAyahs * baseTimePerAyah) / 60
    
    # Add buffer time (25%)
    durationWithBuffer = durationMinutes * 1.25
    
    # Round up to nearest 5 minutes
    return ceil(durationWithBuffer / 5) * 5
```

### 2.5 Long-Term Review Scheduling

```
function scheduleLongTermReviews(userProfile, currentDate):
    # Define long-term review intervals (in days)
    # Increasing intervals based on spaced repetition principles
    longTermIntervals = [
        30,    # 1 month
        90,    # 3 months
        180,   # 6 months
        365    # 1 year
    ]
    
    longTermReviews = []
    
    # Get all memorized juz' or sections
    memorizedSections = baserow.query("MemorizationProgress", {
        "userId": userProfile.userId,
        "completionDate": {"$lt": currentDate - 7 days},
        "type": "Juz"
    })
    
    # For each memorized section, schedule reviews at increasing intervals
    for section in memorizedSections:
        # Get last review date
        lastReviewDate = getLastReviewDate(userProfile.userId, section.juzNumber)
        
        # Determine appropriate interval based on review history
        interval = determineNextInterval(lastReviewDate, longTermIntervals)
        
        # Calculate next review date
        nextReviewDate = lastReviewDate + interval days
        
        # Skip if already reviewed recently or scheduled
        if nextReviewDate <= currentDate:
            continue
            
        reviewEvent = {
            "userId": userProfile.userId,
            "eventType": "LongTermReview",
            "date": nextReviewDate,
            "duration": calculateJuzReviewDuration(section),  # Formula below
            "content": {
                "juzNumber": section.juzNumber,
                "lastReviewDate": lastReviewDate
            }
        }
        
        longTermReviews.push(reviewEvent)
    
    return longTermReviews
```

### 2.6 Juz Review Duration Formula

```
function calculateJuzReviewDuration(juzSection):
    # Average juz length (in ayahs)
    avgAyahsPerJuz = 240
    
    # Average time per ayah for review (in seconds)
    timePerAyah = 15
    
    # Calculate total duration in minutes
    durationMinutes = (avgAyahsPerJuz * timePerAyah) / 60
    
    # Add buffer time (20%)
    durationWithBuffer = durationMinutes * 1.2
    
    # Round up to nearest 15 minutes
    return ceil(durationWithBuffer / 15) * 15
```

### 2.7 Weak Ayah Review Scheduling

```
function scheduleWeakAyahReviews(userProfile, currentDate):
    # Get user's weak ayahs
    weakAyahs = userProfile.weakAyahs
    
    # If no weak ayahs, return empty array
    if weakAyahs.length == 0:
        return []
    
    # Schedule weekly deep review sessions
    reviewDate = findNextWeekday(currentDate, 3)  # e.g., Wednesday
    
    reviewEvent = {
        "userId": userProfile.userId,
        "eventType": "DeepReview",
        "date": reviewDate,
        "duration": calculateWeakAyahReviewDuration(weakAyahs),  # Formula below
        "content": {
            "weakAyahs": weakAyahs
        }
    }
    
    return [reviewEvent]
```

### 2.8 Weak Ayah Review Duration Formula

```
function calculateWeakAyahReviewDuration(weakAyahs):
    # Base time per weak ayah (in minutes)
    baseTimePerAyah = 2
    
    # Calculate total duration
    durationMinutes = weakAyahs.length * baseTimePerAyah
    
    # Minimum duration of 15 minutes
    if durationMinutes < 15:
        durationMinutes = 15
    
    # Maximum duration of 60 minutes
    if durationMinutes > 60:
        durationMinutes = 60
    
    # Round up to nearest 5 minutes
    return ceil(durationMinutes / 5) * 5
```

### 2.9 Mock Recitation Scheduling

```
function scheduleMockRecitation(userProfile, currentDate):
    # Schedule monthly mock recitation
    # Find last day of current month
    lastDayOfMonth = getLastDayOfMonth(currentDate)
    
    # If last day is less than 3 days away, schedule for next month
    if daysBetween(currentDate, lastDayOfMonth) < 3:
        lastDayOfMonth = getLastDayOfMonth(addMonths(currentDate, 1))
    
    mockEvent = {
        "userId": userProfile.userId,
        "eventType": "MockRecitation",
        "date": lastDayOfMonth,
        "duration": 60,  # Fixed 1-hour duration
        "content": {
            "type": "Comprehensive",
            "sections": getMemorizedSections(userProfile)
        }
    }
    
    return [mockEvent]
```

### 2.10 Master Scheduling Function

```
function generateCompleteSchedule(userProfile, currentDate):
    # Initialize empty schedule
    schedule = []
    
    # Generate all schedule components
    newMemEvents = scheduleNewMemorization(userProfile, currentDate)
    recentReviews = scheduleRecentReviews(userProfile, currentDate)
    longTermReviews = scheduleLongTermReviews(userProfile, currentDate)
    weakAyahReviews = scheduleWeakAyahReviews(userProfile, currentDate)
    mockRecitations = scheduleMockRecitation(userProfile, currentDate)
    
    # Combine all events
    schedule = schedule.concat(
        newMemEvents,
        recentReviews,
        longTermReviews,
        weakAyahReviews,
        mockRecitations
    )
    
    # Sort by date
    schedule.sort(function(a, b) {
        return a.date - b.date
    })
    
    # Check for scheduling conflicts and resolve
    schedule = resolveSchedulingConflicts(schedule)
    
    return schedule
```

## 3. Automated Reminder Algorithm

```
function generateReminders(events):
    reminders = []
    
    for event in events:
        # Get user's reminder preferences
        userProfile = baserow.query("UserProfiles", {"userId": event.userId})
        reminderTimes = userProfile.notificationPreferences.reminderTimes
        channels = userProfile.notificationPreferences.channels
        
        # Generate reminder for each time preference
        for minutes in reminderTimes:
            reminderTime = event.date - minutes minutes
            
            reminder = {
                "userId": event.userId,
                "eventId": event.id,
                "reminderTime": reminderTime,
                "channels": channels,
                "message": generateReminderMessage(event, minutes)
            }
            
            reminders.push(reminder)
    
    return reminders
```

### 3.1 Reminder Message Generation

```
function generateReminderMessage(event, minutes):
    # Base message template
    template = "Reminder: {eventType} session in {minutes} minutes."
    
    # Customize based on event type
    if event.eventType == "NewMemorization":
        details = "New memorization of Surah {surah}, starting from ayah {startAyah}."
    elif event.eventType == "RecentReview":
        details = "Recent review of content memorized on {originalDate}."
    elif event.eventType == "LongTermReview":
        details = "Long-term review of Juz {juzNumber}."
    elif event.eventType == "DeepReview":
        details = "Deep review focusing on weak ayahs."
    elif event.eventType == "MockRecitation":
        details = "Comprehensive mock recitation session."
    else:
        details = ""
    
    # Fill in template
    message = template.replace("{eventType}", event.eventType)
                      .replace("{minutes}", minutes)
    
    # Add details if available
    if details:
        message += " " + fillTemplateWithEventData(details, event)
    
    return message
```

## 4. Adaptive Recitation Testing Algorithm

```
function selectTestType(userProfile):
    # Get user's test history
    testHistory = baserow.query("TestingRecords", {"userId": userProfile.userId})
    
    # If no history, start with Last Word - Next Word (easier)
    if testHistory.length == 0:
        return "LastWordNextWord"
    
    # Calculate performance metrics for each test type
    lwPerformance = calculatePerformance(testHistory, "LastWordNextWord")
    maPerformance = calculatePerformance(testHistory, "MiddleAyahRecall")
    
    # If user is struggling with Middle Ayah Recall, prioritize it
    if maPerformance < 0.7 and lwPerformance > 0.8:
        return "MiddleAyahRecall"
    
    # Otherwise, randomly select with weighted probability
    # Lower performance = higher probability of selection
    lwProbability = mapPerformanceToProbability(lwPerformance)
    maProbability = mapPerformanceToProbability(maPerformance)
    
    totalProbability = lwProbability + maProbability
    randomValue = random(0, totalProbability)
    
    if randomValue < lwProbability:
        return "LastWordNextWord"
    else:
        return "MiddleAyahRecall"
```

### 4.1 Performance to Probability Mapping

```
function mapPerformanceToProbability(performance):
    # Invert performance (lower performance = higher probability)
    invertedPerformance = 1 - performance
    
    # Apply exponential weighting to emphasize lower performance
    weightedProbability = invertedPerformance^2 * 100
    
    return weightedProbability
```

### 4.2 Last Word - Next Word Challenge

```
function generateLastWordNextWordTest(userProfile):
    # Get memorized content
    memorizedContent = getMemorizedContent(userProfile)
    
    # Randomly select an ayah (not the last ayah of a surah)
    selectedAyah = randomSelectAyah(memorizedContent, {excludeLastAyahs: true})
    
    # Get next ayah
    nextAyah = getNextAyah(selectedAyah)
    
    # Determine difficulty based on user's past performance
    difficulty = determineDifficulty(userProfile, selectedAyah)
    
    test = {
        "type": "LastWordNextWord",
        "difficulty": difficulty,
        "selectedAyah": selectedAyah,
        "nextAyah": nextAyah,
        "prompt": generatePrompt(difficulty, selectedAyah, nextAyah)
    }
    
    return test
```

### 4.3 Difficulty Determination

```
function determineDifficulty(userProfile, ayah):
    # Get test history for this ayah
    testHistory = baserow.query("TestingRecords", {
        "userId": userProfile.userId,
        "ayah": ayah.id
    })
    
    # If no history, start with medium difficulty
    if testHistory.length == 0:
        return "Medium"
    
    # Calculate success rate
    successRate = countSuccesses(testHistory) / testHistory.length
    
    # Determine difficulty based on success rate
    if successRate > 0.8:
        return "Hard"
    elif successRate > 0.5:
        return "Medium"
    else:
        return "Easy"
```

### 4.4 Prompt Generation

```
function generatePrompt(difficulty, selectedAyah, nextAyah):
    if difficulty == "Easy":
        # Provide last word of current ayah and first word of next
        return {
            "lastWord": getLastWord(selectedAyah),
            "firstWord": getFirstWord(nextAyah),
            "surahName": selectedAyah.surahName
        }
    elif difficulty == "Medium":
        # Provide only last word of current ayah
        return {
            "lastWord": getLastWord(selectedAyah),
            "firstWord": null,
            "surahName": selectedAyah.surahName
        }
    else:  # Hard
        # Provide minimal hints
        return {
            "lastWord": null,
            "firstWord": null,
            "surahName": selectedAyah.surahName
        }
```

### 4.5 Middle Ayah Recall

```
function generateMiddleAyahRecallTest(userProfile):
    # Get memorized content
    memorizedContent = getMemorizedContent(userProfile)
    
    # Find sections with at least 3 consecutive ayahs
    eligibleSections = findEligibleSections(memorizedContent, 3)
    
    # Randomly select a section
    selectedSection = randomSelect(eligibleSections)
    
    # Randomly select start and end positions (at least 1 ayah apart)
    startPos = randomInt(0, selectedSection.length - 3)
    endPos = randomInt(startPos + 2, selectedSection.length - 1)
    
    # Get the ayahs
    startAyah = selectedSection[startPos]
    endAyah = selectedSection[endPos]
    middleAyahs = selectedSection.slice(startPos + 1, endPos)
    
    test = {
        "type": "MiddleAyahRecall",
        "startAyah": startAyah,
        "endAyah": endAyah,
        "middleAyahs": middleAyahs,
        "prompt": {
            "startAyahText": startAyah.text,
            "endAyahText": endAyah.text,
            "surahName": startAyah.surahName,
            "numberOfMiddleAyahs": middleAyahs.length
        }
    }
    
    return test
```

### 4.6 Test Result Evaluation

```
function evaluateTestResult(test, userResponse):
    if test.type == "LastWordNextWord":
        # Compare user response with correct next ayah
        correctText = test.nextAyah.text
        similarity = calculateTextSimilarity(userResponse, correctText)
        
        # Determine if response is correct (80% similarity threshold)
        isCorrect = similarity >= 0.8
        
        result = {
            "testId": test.id,
            "type": test.type,
            "ayahId": test.nextAyah.id,
            "isCorrect": isCorrect,
            "similarity": similarity,
            "difficulty": test.difficulty
        }
    
    elif test.type == "MiddleAyahRecall":
        # Split user response into potential ayahs
        userAyahs = splitIntoAyahs(userResponse)
        
        # Compare each user ayah with corresponding middle ayah
        matches = []
        for i in range(min(userAyahs.length, test.middleAyahs.length)):
            similarity = calculateTextSimilarity(userAyahs[i], test.middleAyahs[i].text)
            matches.push({
                "ayahId": test.middleAyahs[i].id,
                "similarity": similarity,
                "isCorrect": similarity >= 0.8
            })
        
        # Calculate overall correctness
        correctCount = countCorrectMatches(matches)
        overallCorrectness = correctCount / test.middleAyahs.length
        
        result = {
            "testId": test.id,
            "type": test.type,
            "matches": matches,
            "overallCorrectness": overallCorrectness,
            "isCorrect": overallCorrectness >= 0.8
        }
    
    return result
```

### 4.7 Text Similarity Calculation

```
function calculateTextSimilarity(text1, text2):
    # Normalize texts (remove diacritics, standardize spacing)
    normalizedText1 = normalizeArabicText(text1)
    normalizedText2 = normalizeArabicText(text2)
    
    # Split into words
    words1 = normalizedText1.split(" ")
    words2 = normalizedText2.split(" ")
    
    # Calculate Levenshtein distance for each word pair
    matchedWords = 0
    for word1 in words1:
        bestMatch = 0
        for word2 in words2:
            similarity = 1 - (levenshteinDistance(word1, word2) / max(word1.length, word2.length))
            bestMatch = max(bestMatch, similarity)
        
        # Count as match if similarity is above threshold
        if bestMatch > 0.7:
            matchedWords += bestMatch
    
    # Calculate overall similarity
    overallSimilarity = matchedWords / words1.length
    
    return overallSimilarity
```

## 5. Weak Ayah Identification Algorithm

```
function identifyWeakAyahs(userProfile):
    # Get all test results for this user
    testResults = baserow.query("TestingRecords", {"userId": userProfile.userId})
    
    # Group by ayah
    ayahPerformance = {}
    
    for result in testResults:
        if result.type == "LastWordNextWord":
            ayahId = result.ayahId
            if ayahId not in ayahPerformance:
                ayahPerformance[ayahId] = {
                    "totalTests": 0,
                    "failedTests": 0,
                    "lastTestDate": null
                }
            
            ayahPerformance[ayahId].totalTests += 1
            if not result.isCorrect:
                ayahPerformance[ayahId].failedTests += 1
            
            ayahPerformance[ayahId].lastTestDate = max(
                ayahPerformance[ayahId].lastTestDate,
                result.testDate
            )
        
        elif result.type == "MiddleAyahRecall":
            for match in result.matches:
                ayahId = match.ayahId
                if ayahId not in ayahPerformance:
                    ayahPerformance[ayahId] = {
                        "totalTests": 0,
                        "failedTests": 0,
                        "lastTestDate": null
                    }
                
                ayahPerformance[ayahId].totalTests += 1
                if not match.isCorrect:
                    ayahPerformance[ayahId].failedTests += 1
                
                ayahPerformance[ayahId].lastTestDate = max(
                    ayahPerformance[ayahId].lastTestDate,
                    result.testDate
                )
    
    # Identify weak ayahs (failure rate > 30% with at least 3 tests)
    weakAyahs = []
    
    for ayahId, performance in ayahPerformance:
        if performance.totalTests >= 3:
            failureRate = performance.failedTests / performance.totalTests
            
            if failureRate > 0.3:
                ayahDetails = getAyahDetails(ayahId)
                
                weakAyah = {
                    "ayahId": ayahId,
                    "surah": ayahDetails.surahNumber,
                    "ayahNumber": ayahDetails.ayahNumber,
                    "failureRate": failureRate,
                    "totalTests": performance.totalTests,
                    "lastTestDate": performance.lastTestDate
                }
                
                weakAyahs.push(weakAyah)
    
    # Sort by failure rate (highest first)
    weakAyahs.sort(function(a, b) {
        return b.failureRate - a.failureRate
    })
    
    return weakAyahs
```

## 6. Dynamic Study Plan Adjustment Algorithm

```
function adjustStudyPlan(userProfile, currentSchedule):
    # Analyze user's progress and performance
    progressMetrics = analyzeProgress(userProfile)
    
    # Determine if adjustments are needed
    if progressMetrics.isStruggling:
        # Reduce pace of new memorization
        adjustedSchedule = reduceMemorizationPace(currentSchedule, progressMetrics.struggleLevel)
        
        # Increase frequency of recent reviews
        adjustedSchedule = increaseRecentReviews(adjustedSchedule, progressMetrics.struggleLevel)
        
        # Prioritize weak ayah reviews
        adjustedSchedule = prioritizeWeakAyahs(adjustedSchedule, userProfile.weakAyahs)
    
    elif progressMetrics.isExcelling:
        # Maintain or slightly increase pace if aligned with goals
        if progressMetrics.aheadOfSchedule:
            adjustedSchedule = maintainCurrentPace(currentSchedule)
        else:
            adjustedSchedule = slightlyIncreasePace(currentSchedule, progressMetrics.excellenceLevel)
        
        # Adjust long-term review intervals based on retention
        adjustedSchedule = optimizeLongTermReviews(adjustedSchedule, progressMetrics.retentionRate)
    
    else:
        # Maintain current pace
        adjustedSchedule = currentSchedule
    
    return adjustedSchedule
```

### 6.1 Progress Analysis

```
function analyzeProgress(userProfile):
    # Get completion history
    completionHistory = baserow.query("MemorizationProgress", {"userId": userProfile.userId})
    
    # Get test results
    testResults = baserow.query("TestingRecords", {"userId": userProfile.userId})
    
    # Calculate metrics
    
    # 1. Rate of new memorization (pages per week)
    memorizationRate = calculateMemorizationRate(completionHistory)
    
    # 2. Consistency of review completion
    reviewCompletionRate = calculateReviewCompletionRate(userProfile)
    
    # 3. Performance on recitation tests
    testSuccessRate = calculateTestSuccessRate(testResults)
    
    # 4. Retention rate (success on long-term reviews)
    retentionRate = calculateRetentionRate(testResults)
    
    # Determine if user is struggling
    isStruggling = (
        memorizationRate < userProfile.personalGoals.weeklyPages * 0.7 or
        reviewCompletionRate < 0.6 or
        testSuccessRate < 0.7
    )
    
    # Determine struggle level (1-3)
    struggleLevel = 0
    if isStruggling:
        struggleFactors = 0
        if memorizationRate < userProfile.personalGoals.weeklyPages * 0.7:
            struggleFactors += 1
        if reviewCompletionRate < 0.6:
            struggleFactors += 1
        if testSuccessRate < 0.7:
            struggleFactors += 1
        
        struggleLevel = struggleFactors
    
    # Determine if user is excelling
    isExcelling = (
        memorizationRate >= userProfile.personalGoals.weeklyPages and
        reviewCompletionRate > 0.9 and
        testSuccessRate > 0.9 and
        retentionRate > 0.85
    )
    
    # Determine excellence level (1-3)
    excellenceLevel = 0
    if isExcelling:
        excellenceFactors = 0
        if memorizationRate >= userProfile.personalGoals.weeklyPages * 1.2:
            excellenceFactors += 1
        if reviewCompletionRate > 0.95:
            excellenceFactors += 1
        if testSuccessRate > 0.95:
            excellenceFactors += 1
        
        excellenceLevel = excellenceFactors
    
    # Check if ahead of schedule
    targetDate = userProfile.personalGoals.targetCompletionDate
    aheadOfSchedule = false
    
    if targetDate:
        projectedCompletionDate = calculateProjectedCompletionDate(
            userProfile.currentProgress,
            memorizationRate
        )
        
        aheadOfSchedule = projectedCompletionDate < targetDate
    
    return {
        "memorizationRate": memorizationRate,
        "reviewCompletionRate": reviewCompletionRate,
        "testSuccessRate": testSuccessRate,
        "retentionRate": retentionRate,
        "isStruggling": isStruggling,
        "struggleLevel": struggleLevel,
        "isExcelling": isExcelling,
        "excellenceLevel": excellenceLevel,
        "aheadOfSchedule": aheadOfSchedule
    }
```

### 6.2 Pace Reduction Formula

```
function reduceMemorizationPace(schedule, struggleLevel):
    # Get new memorization events
    newMemEvents = schedule.filter(event => event.eventType == "NewMemorization")
    
    # Calculate reduction factor based on struggle level
    reductionFactor = 0.9 - (struggleLevel * 0.1)  # 0.8, 0.7, or 0.6
    
    # Apply reduction to each event
    for event in newMemEvents:
        # Reduce pages
        originalPages = event.content.pages
        reducedPages = originalPages * reductionFactor
        
        # Round to nearest quarter page
        reducedPages = round(reducedPages * 4) / 4
        
        # Ensure minimum of 0.25 pages
        reducedPages = max(reducedPages, 0.25)
        
        # Update event
        event.content.pages = reducedPages
        event.content.endPosition = estimateEndPosition(
            event.content.startPosition,
            reducedPages
        )
        
        # Recalculate duration
        event.duration = calculateDuration(reducedPages)
    
    # Update schedule
    updatedSchedule = schedule.map(event => {
        if event.eventType == "NewMemorization":
            return newMemEvents.find(e => e.id == event.id)
        }
        return event
    })
    
    return updatedSchedule
```

### 6.3 Increase Recent Reviews Formula

```
function increaseRecentReviews(schedule, struggleLevel):
    # Get recent review events
    recentReviews = schedule.filter(event => event.eventType == "RecentReview")
    
    # Calculate additional review factor based on struggle level
    additionalReviewFactor = struggleLevel * 0.5  # 0.5, 1.0, or 1.5
    
    # Group by original memorization date
    groupedReviews = {}
    for review in recentReviews:
        originalDate = review.content.originalMemorizationDate
        if originalDate not in groupedReviews:
            groupedReviews[originalDate] = []
        
        groupedReviews[originalDate].push(review)
    
    # Add additional reviews for each group
    additionalReviews = []
    
    for originalDate, reviews in groupedReviews:
        # Sort by date
        reviews.sort(function(a, b) {
            return a.date - b.date
        })
        
        # Get existing review intervals
        existingIntervals = []
        for review in reviews:
            interval = daysBetween(originalDate, review.date)
            existingIntervals.push(interval)
        
        # Determine new intervals based on struggle level
        newIntervals = []
        
        if struggleLevel == 1:
            # Add one intermediate review
            if existingIntervals.includes(1) and existingIntervals.includes(7):
                newIntervals.push(4)  # Add review at day 4
            elif existingIntervals.includes(2) and existingIntervals.includes(7):
                newIntervals.push(4)  # Add review at day 4
        
        elif struggleLevel == 2:
            # Add two intermediate reviews
            if existingIntervals.includes(1) and existingIntervals.includes(7):
                newIntervals.push(3, 5)  # Add reviews at days 3 and 5
            elif existingIntervals.includes(2) and existingIntervals.includes(7):
                newIntervals.push(4, 6)  # Add reviews at days 4 and 6
        
        elif struggleLevel == 3:
            # Add three intermediate reviews
            if existingIntervals.includes(1) and existingIntervals.includes(7):
                newIntervals.push(2, 4, 6)  # Add reviews at days 2, 4, and 6
            elif existingIntervals.includes(2) and existingIntervals.includes(7):
                newIntervals.push(3, 4, 6)  # Add reviews at days 3, 4, and 6
        
        # Create additional review events
        for interval in newIntervals:
            reviewDate = originalDate + interval days
            
            # Skip if date is in the past
            if reviewDate < currentDate:
                continue
            
            # Create new review event
            newReview = {
                "userId": reviews[0].userId,
                "eventType": "RecentReview",
                "date": reviewDate,
                "duration": reviews[0].duration,  # Use same duration as first review
                "content": {
                    "originalMemorizationDate": originalDate,
                    "sections": reviews[0].content.sections,
                    "isAdditionalReview": true
                }
            }
            
            additionalReviews.push(newReview)
    
    # Add additional reviews to schedule
    updatedSchedule = schedule.concat(additionalReviews)
    
    # Sort by date
    updatedSchedule.sort(function(a, b) {
        return a.date - b.date
    })
    
    return updatedSchedule
```

### 6.4 Prioritize Weak Ayahs Formula

```
function prioritizeWeakAyahs(schedule, weakAyahs):
    # If no weak ayahs, return unchanged schedule
    if weakAyahs.length == 0:
        return schedule
    
    # Get deep review events
    deepReviews = schedule.filter(event => event.eventType == "DeepReview")
    
    # If no deep reviews exist, create weekly deep review
    if deepReviews.length == 0:
        # Find next available day
        nextAvailableDay = findNextAvailableDay(schedule, currentDate)
        
        # Create new deep review event
        newDeepReview = {
            "userId": weakAyahs[0].userId,
            "eventType": "DeepReview",
            "date": nextAvailableDay,
            "duration": calculateWeakAyahReviewDuration(weakAyahs),
            "content": {
                "weakAyahs": weakAyahs
            }
        }
        
        schedule.push(newDeepReview)
    else {
        # Update existing deep reviews with latest weak ayahs
        for review in deepReviews:
            review.content.weakAyahs = weakAyahs
            review.duration = calculateWeakAyahReviewDuration(weakAyahs)
    }
    
    # Sort by date
    updatedSchedule = schedule.sort(function(a, b) {
        return a.date - b.date
    })
    
    return updatedSchedule
```

### 6.5 Optimize Long-Term Reviews Formula

```
function optimizeLongTermReviews(schedule, retentionRate):
    # Get long-term review events
    longTermReviews = schedule.filter(event => event.eventType == "LongTermReview")
    
    # Adjust intervals based on retention rate
    for review in longTermReviews:
        # Get original interval
        originalInterval = daysBetween(review.content.lastReviewDate, review.date)
        
        # Calculate adjustment factor based on retention rate
        if retentionRate > 0.95:
            // Excellent retention - extend interval by 20%
            adjustmentFactor = 1.2
        elif retentionRate > 0.9:
            // Very good retention - extend interval by 10%
            adjustmentFactor = 1.1
        elif retentionRate > 0.85:
            // Good retention - keep interval the same
            adjustmentFactor = 1.0
        else:
            // Below threshold - no adjustment needed
            continue
        
        // Calculate new interval
        newInterval = round(originalInterval * adjustmentFactor)
        
        // Calculate new review date
        newReviewDate = review.content.lastReviewDate + newInterval days
        
        // Update review date
        review.date = newReviewDate
    }
    
    // Sort by date
    updatedSchedule = schedule.sort(function(a, b) {
        return a.date - b.date
    })
    
    return updatedSchedule
```

## 7. Integration with External Systems

### 7.1 Google Calendar Integration

```
function syncWithGoogleCalendar(schedule, userProfile):
    # Get existing calendar events
    existingEvents = getGoogleCalendarEvents(userProfile.userId)
    
    # Process each scheduled event
    for event in schedule:
        # Check if event already exists in calendar
        existingEvent = findMatchingEvent(existingEvents, event)
        
        if existingEvent:
            # Update existing event if needed
            if hasChanges(existingEvent, event):
                updateCalendarEvent(existingEvent.id, formatCalendarEvent(event))
        else:
            # Create new calendar event
            createCalendarEvent(formatCalendarEvent(event))
    
    # Remove obsolete events
    for existingEvent in existingEvents:
        if not findMatchingEvent(schedule, existingEvent):
            deleteCalendarEvent(existingEvent.id)
    
    return true
```

### 7.2 Calendar Event Formatting

```
function formatCalendarEvent(event):
    # Base event data
    calendarEvent = {
        "summary": formatEventTitle(event),
        "description": formatEventDescription(event),
        "start": {
            "dateTime": formatDateTime(event.date),
            "timeZone": "UTC"
        },
        "end": {
            "dateTime": formatDateTime(event.date + event.duration minutes),
            "timeZone": "UTC"
        },
        "reminders": {
            "useDefault": false,
            "overrides": [
                {"method": "popup", "minutes": 15}
            ]
        },
        "colorId": getColorForEventType(event.eventType),
        "metadata": {
            "eventId": event.id,
            "eventType": event.eventType
        }
    }
    
    return calendarEvent
```

### 7.3 n8n Workflow Trigger

```
function triggerN8nWorkflow(workflowName, payload):
    # Construct webhook URL
    webhookUrl = "https://n8n.example.com/webhook/" + workflowName
    
    # Send HTTP POST request
    response = httpPost(webhookUrl, {
        "headers": {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + getN8nApiKey()
        },
        "body": JSON.stringify(payload)
    })
    
    # Check response
    if response.statusCode >= 200 and response.statusCode < 300:
        return {
            "success": true,
            "workflowId": response.body.workflowId,
            "executionId": response.body.executionId
        }
    else:
        return {
            "success": false,
            "error": response.body.error || "Unknown error"
        }
```

## 8. Utility Functions

### 8.1 Date Utilities

```
function findNextOccurrence(daysOfWeek, startDate):
    # Convert day names to day numbers (0 = Sunday, 6 = Saturday)
    dayNumbers = convertDayNamesToNumbers(daysOfWeek)
    
    # Get current day of week
    currentDayNumber = startDate.getDay()
    
    # Find next day in the list
    daysToAdd = 7
    for dayNumber in dayNumbers:
        diff = (dayNumber - currentDayNumber + 7) % 7
        if diff == 0:
            # Same day, use next week
            diff = 7
        
        daysToAdd = min(daysToAdd, diff)
    
    # Calculate next date
    nextDate = startDate + daysToAdd days
    
    return nextDate
```

### 8.2 Text Processing

```
function normalizeArabicText(text):
    # Remove diacritics (tashkeel)
    normalized = removeDiacritics(text)
    
    # Standardize alifs
    normalized = standardizeAlifs(normalized)
    
    # Standardize spacing
    normalized = standardizeSpacing(normalized)
    
    return normalized
```

### 8.3 Levenshtein Distance

```
function levenshteinDistance(s1, s2):
    # Create matrix
    matrix = []
    for i in range(s1.length + 1):
        matrix.push([])
        for j in range(s2.length + 1):
            matrix[i].push(0)
    
    # Initialize first row and column
    for i in range(s1.length + 1):
        matrix[i][0] = i
    
    for j in range(s2.length + 1):
        matrix[0][j] = j
    
    # Fill matrix
    for j in range(1, s2.length + 1):
        for i in range(1, s1.length + 1):
            if s1[i-1] == s2[j-1]:
                matrix[i][j] = matrix[i-1][j-1]
            else:
                matrix[i][j] = min(
                    matrix[i-1][j] + 1,    # deletion
                    matrix[i][j-1] + 1,    # insertion
                    matrix[i-1][j-1] + 1   # substitution
                )
    
    return matrix[s1.length][s2.length]
```

### 8.4 Conflict Resolution

```
function resolveSchedulingConflicts(schedule):
    # Sort by date
    sortedSchedule = schedule.sort(function(a, b) {
        return a.date - b.date
    })
    
    # Check for overlapping events
    for i in range(sortedSchedule.length - 1):
        currentEvent = sortedSchedule[i]
        nextEvent = sortedSchedule[i+1]
        
        # Calculate end time of current event
        currentEndTime = currentEvent.date + currentEvent.duration minutes
        
        # Check if there's an overlap
        if currentEndTime > nextEvent.date:
            # Calculate overlap in minutes
            overlapMinutes = (currentEndTime - nextEvent.date) / (1000 * 60)
            
            # If overlap is small (< 15 minutes), adjust duration of current event
            if overlapMinutes < 15:
                currentEvent.duration -= overlapMinutes
            else:
                # Move next event to after current event with 15-minute buffer
                nextEvent.date = currentEndTime + 15 minutes
    
    return sortedSchedule
```
